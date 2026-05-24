#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <map>
#include <set>
#include <stdexcept>
#include <string>
#include <vector>

namespace fs = std::filesystem;

static const std::string DATA_PATH = "data/users.txt";
static const std::string BACKUP_PATH = "data/users.txt.backup_before_adversarial_cpp_system_test";

static std::string joinLines(const std::vector<std::string>& lines) {
    std::string result;

    for (const std::string& line : lines) {
        result += line;
        result += "\n";
    }

    return result;
}

static std::string normalizeText(const std::string& text) {
    std::string normalized;

    for (size_t i = 0; i < text.size(); i++) {
        if (text[i] == '\r') {
            if (i + 1 < text.size() && text[i + 1] == '\n') {
                continue;
            }

            normalized += '\n';
        } else {
            normalized += text[i];
        }
    }

    return normalized;
}

static void writeTextFile(const std::string& path, const std::string& content) {
    std::ofstream file(path, std::ios::binary);

    if (!file) {
        throw std::runtime_error("Failed to create file: " + path);
    }

    file << content;
}

static std::string readTextFile(const std::string& path) {
    std::ifstream file(path, std::ios::binary);

    if (!file) {
        throw std::runtime_error("Failed to read file: " + path);
    }

    return std::string(
        std::istreambuf_iterator<char>(file),
        std::istreambuf_iterator<char>()
    );
}

static void assertTextEquals(
    const std::string& testName,
    const std::string& actualText,
    const std::string& expectedText
) {
    std::string actual = normalizeText(actualText);
    std::string expected = normalizeText(expectedText);

    if (actual != expected) {
        std::cerr << "\n==================== " << testName << " FAILED ====================\n";
        std::cerr << "Expected:\n" << expected << "\n";
        std::cerr << "Actual:\n" << actual << "\n";
        throw std::runtime_error(testName + " failed");
    }

    std::cout << testName << " passed\n";
}

static void assertFileEquals(
    const std::string& testName,
    const std::string& path,
    const std::string& expectedText
) {
    if (!fs::exists(path)) {
        throw std::runtime_error(testName + " failed: file does not exist: " + path);
    }

    assertTextEquals(testName, readTextFile(path), expectedText);
}

static std::string getAppExecutablePath() {
#ifdef _WIN32
    return ".\\todo_app.exe";
#else
    return "./todo_app";
#endif
}

static void runAppWithInput(
    const std::string& inputPath,
    const std::string& outputPath
) {
    std::string command =
        getAppExecutablePath() + " < " + inputPath + " > " + outputPath;

    int exitCode = std::system(command.c_str());

    if (exitCode != 0) {
        throw std::runtime_error(
            getAppExecutablePath() + " failed with exit code: " + std::to_string(exitCode)
        );
    }
}

static void addExpectedProducts(
    std::map<int, std::set<int>>& expectedUsers,
    int userId,
    const std::vector<int>& productIds
) {
    for (int productId : productIds) {
        expectedUsers[userId].insert(productId);
    }
}

static std::string expectedDataFileText(
    const std::map<int, std::set<int>>& expectedUsers
) {
    std::string result;

    for (const auto& userEntry : expectedUsers) {
        int userId = userEntry.first;
        const std::set<int>& products = userEntry.second;

        result += std::to_string(userId);
        result += ":";

        bool firstProduct = true;

        for (int productId : products) {
            if (!firstProduct) {
                result += ",";
            }

            result += std::to_string(productId);
            firstProduct = false;
        }

        result += "\n";
    }

    return result;
}

static void backupDataFileIfNeeded(bool& hadOriginalDataFile) {
    fs::create_directories("data");

    hadOriginalDataFile = fs::exists(DATA_PATH);

    if (hadOriginalDataFile) {
        fs::copy_file(DATA_PATH, BACKUP_PATH, fs::copy_options::overwrite_existing);
    }
}

static void restoreDataFile(bool hadOriginalDataFile) {
    if (hadOriginalDataFile && fs::exists(BACKUP_PATH)) {
        fs::copy_file(BACKUP_PATH, DATA_PATH, fs::copy_options::overwrite_existing);
        fs::remove(BACKUP_PATH);
        std::cout << "Original data/users.txt was restored.\n";
    } else {
        fs::remove(DATA_PATH);
        std::cout << "Temporary data/users.txt was removed.\n";
    }
}

static void removeGeneratedFiles() {
    fs::remove("tests/adversarial_input_1.txt");
    fs::remove("tests/adversarial_output_1.txt");
    fs::remove("tests/adversarial_input_2.txt");
    fs::remove("tests/adversarial_output_2.txt");
    fs::remove("tests/adversarial_input_3.txt");
    fs::remove("tests/adversarial_output_3.txt");
}

static void testKnownRecommendationAndInvalidCommands() {
    std::map<int, std::set<int>> expectedUsers;

    std::vector<std::string> inputLines = {
        "help",
        " add 99 999",
        "\tadd 98 998",
        "ADD 97 997",
        "add 1 100 101 102 103 103",
        "add 2 101 102 104 105 106",
        "add 3 100 104 105 107 108",
        "add 4 101 105 106 107 109 110",
        "add 5 100 102 103 105 108 111",
        "add 6 100 103 104 110 111 112 113",
        "add 7 102 105 106 107 108 109 110",
        "add 8 101 104 105 106 109 111 114",
        "add 9 100 103 105 107 112 113 115",
        "add 10 100 102 105 106 107 109 110 116",
        "add 11 104 105 118 119",
        "add 12 100 104 105 120",
        "add 13 104 105 121",
        "add 2 106 106 117",
        "add 15",
        "add abc 200",
        "add 16 abc",
        "recommend 2 104",
        "recommend 2 999",
        "recommend 99 100",
        "recommend 1 104",
        "recommend 2 104 105",
        "help now",
        "delete 1 100",
        "",
        "help"
    };

    addExpectedProducts(expectedUsers, 1, {100, 101, 102, 103, 103});
    addExpectedProducts(expectedUsers, 2, {101, 102, 104, 105, 106});
    addExpectedProducts(expectedUsers, 3, {100, 104, 105, 107, 108});
    addExpectedProducts(expectedUsers, 4, {101, 105, 106, 107, 109, 110});
    addExpectedProducts(expectedUsers, 5, {100, 102, 103, 105, 108, 111});
    addExpectedProducts(expectedUsers, 6, {100, 103, 104, 110, 111, 112, 113});
    addExpectedProducts(expectedUsers, 7, {102, 105, 106, 107, 108, 109, 110});
    addExpectedProducts(expectedUsers, 8, {101, 104, 105, 106, 109, 111, 114});
    addExpectedProducts(expectedUsers, 9, {100, 103, 105, 107, 112, 113, 115});
    addExpectedProducts(expectedUsers, 10, {100, 102, 105, 106, 107, 109, 110, 116});
    addExpectedProducts(expectedUsers, 11, {104, 105, 118, 119});
    addExpectedProducts(expectedUsers, 12, {100, 104, 105, 120});
    addExpectedProducts(expectedUsers, 13, {104, 105, 121});
    addExpectedProducts(expectedUsers, 2, {106, 106, 117});

    writeTextFile("tests/adversarial_input_1.txt", joinLines(inputLines));

    runAppWithInput(
        "tests/adversarial_input_1.txt",
        "tests/adversarial_output_1.txt"
    );

    const std::string expectedOutput = joinLines({
        "add [userid] [productid1] [productid2] ...",
        "recommend [userid] [productid]",
        "help",
        "100 111 109 114 107 108 118 119 120 121",
        "",
        "",
        "",
        "add [userid] [productid1] [productid2] ...",
        "recommend [userid] [productid]",
        "help"
    });

    assertFileEquals(
        "Known recommendation + invalid commands output",
        "tests/adversarial_output_1.txt",
        expectedOutput
    );

    assertFileEquals(
        "Known recommendation + invalid commands persistence",
        DATA_PATH,
        expectedDataFileText(expectedUsers)
    );
}

static void testBulkAddStressAndPersistence() {
    std::map<int, std::set<int>> expectedUsers;

    std::vector<std::string> inputLines = {
        " add 9000 9000",
        "\tadd 9001 9001",
        "ADD 9002 9002",
        "add",
        "add 9003",
        "add abc 9004",
        "add 9005 abc",
        "recommend",
        "recommend 1",
        "recommend abc 100",
        "recommend 1 abc",
        "recommend 1 100 200",
        "delete 1 100",
        "show",
        "help now",
        "",
        "   "
    };

    for (int userId = 20; userId <= 119; userId++) {
        std::vector<int> products = {
            1000 + (userId % 10),
            2000 + (userId % 7),
            3000 + (userId % 13),
            4000 + (userId % 5),
            1000 + (userId % 10),
            2000 + (userId % 7)
        };

        std::string command = "add " + std::to_string(userId);

        for (int productId : products) {
            command += " ";
            command += std::to_string(productId);
        }

        inputLines.push_back(command);
        addExpectedProducts(expectedUsers, userId, products);

        if (userId % 10 == 0) {
            inputLines.push_back(" add " + std::to_string(userId + 10000) + " 7777");
            inputLines.push_back("\tadd " + std::to_string(userId + 10001) + " 8888");
            inputLines.push_back("add " + std::to_string(userId + 10002));
            inputLines.push_back("add " + std::to_string(userId + 10003) + " bad_product");
        }
    }

    for (int userId = 20; userId <= 39; userId++) {
        std::vector<int> extraProducts = {
            5000,
            5000,
            5001,
            1000 + (userId % 10)
        };

        std::string command = "add " + std::to_string(userId);

        for (int productId : extraProducts) {
            command += " ";
            command += std::to_string(productId);
        }

        inputLines.push_back(command);
        addExpectedProducts(expectedUsers, userId, extraProducts);
    }

    writeTextFile("tests/adversarial_input_2.txt", joinLines(inputLines));

    runAppWithInput(
        "tests/adversarial_input_2.txt",
        "tests/adversarial_output_2.txt"
    );

    assertFileEquals(
        "Bulk stress output should be empty",
        "tests/adversarial_output_2.txt",
        ""
    );

    assertFileEquals(
        "Bulk stress persistence",
        DATA_PATH,
        expectedDataFileText(expectedUsers)
    );
}

static void testReloadThenMoreStress() {
    std::map<int, std::set<int>> expectedUsers;

    for (int userId = 20; userId <= 119; userId++) {
        addExpectedProducts(expectedUsers, userId, {
            1000 + (userId % 10),
            2000 + (userId % 7),
            3000 + (userId % 13),
            4000 + (userId % 5)
        });
    }

    for (int userId = 20; userId <= 39; userId++) {
        addExpectedProducts(expectedUsers, userId, {
            5000,
            5001,
            1000 + (userId % 10)
        });
    }

    std::vector<std::string> inputLines;

    for (int userId = 120; userId <= 150; userId++) {
        std::vector<int> products = {
            6000 + (userId % 4),
            7000 + (userId % 6),
            8000 + (userId % 8),
            6000 + (userId % 4)
        };

        std::string command = "add " + std::to_string(userId);

        for (int productId : products) {
            command += " ";
            command += std::to_string(productId);
        }

        inputLines.push_back(command);
        addExpectedProducts(expectedUsers, userId, products);
    }

    inputLines.push_back(" add 99999 1");
    inputLines.push_back("\tadd 99998 1");
    inputLines.push_back("ADD 99997 1");
    inputLines.push_back("add 99996");
    inputLines.push_back("add text 1");
    inputLines.push_back("add 99995 text");
    inputLines.push_back("recommend 99999 1");
    inputLines.push_back("help");

    writeTextFile("tests/adversarial_input_3.txt", joinLines(inputLines));

    runAppWithInput(
        "tests/adversarial_input_3.txt",
        "tests/adversarial_output_3.txt"
    );

    const std::string expectedOutput = joinLines({
        "",
        "add [userid] [productid1] [productid2] ...",
        "recommend [userid] [productid]",
        "help"
    });

    assertFileEquals(
        "Reload + more stress output",
        "tests/adversarial_output_3.txt",
        expectedOutput
    );

    assertFileEquals(
        "Reload + more stress persistence",
        DATA_PATH,
        expectedDataFileText(expectedUsers)
    );
}

int main() {
    bool hadOriginalDataFile = false;

    try {
        if (!fs::exists(getAppExecutablePath())) {
            throw std::runtime_error(getAppExecutablePath() + " was not found. Compile the app first.");
        }

        fs::create_directories("tests");
        backupDataFileIfNeeded(hadOriginalDataFile);

        fs::remove(DATA_PATH);
        testKnownRecommendationAndInvalidCommands();

        fs::remove(DATA_PATH);
        testBulkAddStressAndPersistence();

        testReloadThenMoreStress();

        restoreDataFile(hadOriginalDataFile);
        removeGeneratedFiles();

        std::cout << "\nBIG ADVERSARIAL C++ SYSTEM TEST PASSED SUCCESSFULLY!\n";
        return 0;
    } catch (const std::exception& ex) {
        try {
            restoreDataFile(hadOriginalDataFile);
            removeGeneratedFiles();
        } catch (...) {
            std::cerr << "Cleanup failed.\n";
        }

        std::cerr << "\nBIG ADVERSARIAL C++ SYSTEM TEST FAILED: " << ex.what() << "\n";
        return 1;
    }
}

