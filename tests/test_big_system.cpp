#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

namespace fs = std::filesystem;

static const std::string DATA_PATH = "data/users.txt";
static const std::string BACKUP_PATH = "data/users.txt.backup_before_big_cpp_system_test";

static std::string joinLines(const std::vector<std::string>& lines) {
    std::string result;

    for (const std::string& line : lines) {
        result += line;
        result += "\n";
    }

    return result;
}

static std::string normalizeText(std::string text) {
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

static void backupDataFileIfNeeded(bool& hadBackup) {
    fs::create_directories("data");

    hadBackup = fs::exists(DATA_PATH);

    if (hadBackup) {
        fs::copy_file(DATA_PATH, BACKUP_PATH, fs::copy_options::overwrite_existing);
    }
}

static void restoreDataFile(bool hadBackup) {
    if (hadBackup && fs::exists(BACKUP_PATH)) {
        fs::copy_file(BACKUP_PATH, DATA_PATH, fs::copy_options::overwrite_existing);
        fs::remove(BACKUP_PATH);
        std::cout << "Original data/users.txt was restored.\n";
    } else {
        fs::remove(DATA_PATH);
        std::cout << "Temporary data/users.txt was removed.\n";
    }
}

static void testFirstFullRun() {
    const std::string input1 = joinLines({
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
    });

    writeTextFile("tests/big_system_input_1.txt", input1);

    runAppWithInput(
        "tests/big_system_input_1.txt",
        "tests/big_system_output_1.txt"
    );

    const std::string expectedOutput1 = joinLines({
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
        "Run 1 output",
        "tests/big_system_output_1.txt",
        expectedOutput1
    );

    const std::string expectedData1 = joinLines({
        "1:100,101,102,103",
        "2:101,102,104,105,106,117",
        "3:100,104,105,107,108",
        "4:101,105,106,107,109,110",
        "5:100,102,103,105,108,111",
        "6:100,103,104,110,111,112,113",
        "7:102,105,106,107,108,109,110",
        "8:101,104,105,106,109,111,114",
        "9:100,103,105,107,112,113,115",
        "10:100,102,105,106,107,109,110,116",
        "11:104,105,118,119",
        "12:100,104,105,120",
        "13:104,105,121"
    });

    assertFileEquals(
        "Run 1 persistence file",
        DATA_PATH,
        expectedData1
    );
}

static void testReloadAndSecondRun() {
    const std::string input2 = joinLines({
        "recommend 2 104",
        "add 14 101 102 104 105 122 123 124",
        "recommend 2 104",
        " add 50 500",
        "\tadd 51 501",
        "add 52",
        "add user 999",
        "recommend 14 999",
        "help"
    });

    writeTextFile("tests/big_system_input_2.txt", input2);

    runAppWithInput(
        "tests/big_system_input_2.txt",
        "tests/big_system_output_2.txt"
    );

    const std::string expectedOutput2 = joinLines({
        "100 111 109 114 107 108 118 119 120 121",
        "100 111 109 114 122 123 124 107 108 118",
        "",
        "add [userid] [productid1] [productid2] ...",
        "recommend [userid] [productid]",
        "help"
    });

    assertFileEquals(
        "Run 2 output after reload",
        "tests/big_system_output_2.txt",
        expectedOutput2
    );

    const std::string expectedData2 = joinLines({
        "1:100,101,102,103",
        "2:101,102,104,105,106,117",
        "3:100,104,105,107,108",
        "4:101,105,106,107,109,110",
        "5:100,102,103,105,108,111",
        "6:100,103,104,110,111,112,113",
        "7:102,105,106,107,108,109,110",
        "8:101,104,105,106,109,111,114",
        "9:100,103,105,107,112,113,115",
        "10:100,102,105,106,107,109,110,116",
        "11:104,105,118,119",
        "12:100,104,105,120",
        "13:104,105,121",
        "14:101,102,104,105,122,123,124"
    });

    assertFileEquals(
        "Run 2 persistence file",
        DATA_PATH,
        expectedData2
    );
}

static void removeGeneratedFiles() {
    fs::remove("tests/big_system_input_1.txt");
    fs::remove("tests/big_system_input_2.txt");
    fs::remove("tests/big_system_output_1.txt");
    fs::remove("tests/big_system_output_2.txt");
}

int main() {
    bool hadBackup = false;

    try {
        if (!fs::exists(getAppExecutablePath())) {
            throw std::runtime_error(getAppExecutablePath() + " was not found. Compile the app first.");
        }

        fs::create_directories("tests");
        backupDataFileIfNeeded(hadBackup);
        fs::remove(DATA_PATH);

        testFirstFullRun();
        testReloadAndSecondRun();

        restoreDataFile(hadBackup);
        removeGeneratedFiles();

        std::cout << "\nBIG C++ SYSTEM TEST PASSED SUCCESSFULLY!\n";
        return 0;
    } catch (const std::exception& ex) {
        try {
            restoreDataFile(hadBackup);
            removeGeneratedFiles();
        } catch (...) {
            std::cerr << "Cleanup failed.\n";
        }

        std::cerr << "\nBIG C++ SYSTEM TEST FAILED: " << ex.what() << "\n";
        return 1;
    }
}

