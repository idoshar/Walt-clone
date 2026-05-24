#include <cassert>
#include <fstream>
#include <iostream>
#include <set>
#include <string>
#include <vector>

#include "../src/UserRepository.h"
#include "../src/Persistence.h"

static const std::string TEST_FILE_PATH = "tests/test_users_data.txt";

static void deleteTestFileIfExists() {
    std::remove(TEST_FILE_PATH.c_str());
}

static std::string readWholeFile(const std::string& filePath) {
    std::ifstream file(filePath);
    std::string content;
    std::string line;

    while (std::getline(file, line)) {
        content += line;
        content += "\n";
    }

    return content;
}

void testShouldSaveUsersToFile() {
    deleteTestFileIfExists();

    UserRepository repo;
    repo.addWatchedProducts(1, {100, 101, 102});
    repo.addWatchedProducts(2, {200, 201});

    Persistence::save(repo, TEST_FILE_PATH);

    std::string content = readWholeFile(TEST_FILE_PATH);

    std::string expected =
        "1:100,101,102\n"
        "2:200,201\n";

    assert(content == expected);

    deleteTestFileIfExists();
}

void testShouldSaveUsersInAscendingUserIdOrder() {
    deleteTestFileIfExists();

    UserRepository repo;
    repo.addWatchedProducts(5, {500});
    repo.addWatchedProducts(1, {100});
    repo.addWatchedProducts(3, {300});

    Persistence::save(repo, TEST_FILE_PATH);

    std::string content = readWholeFile(TEST_FILE_PATH);

    std::string expected =
        "1:100\n"
        "3:300\n"
        "5:500\n";

    assert(content == expected);

    deleteTestFileIfExists();
}

void testShouldSaveProductsInAscendingProductIdOrder() {
    deleteTestFileIfExists();

    UserRepository repo;
    repo.addWatchedProducts(1, {105, 100, 103, 101});

    Persistence::save(repo, TEST_FILE_PATH);

    std::string content = readWholeFile(TEST_FILE_PATH);

    std::string expected =
        "1:100,101,103,105\n";

    assert(content == expected);

    deleteTestFileIfExists();
}

void testShouldLoadUsersFromFile() {
    deleteTestFileIfExists();

    {
        std::ofstream file(TEST_FILE_PATH);
        file << "1:100,101,102\n";
        file << "2:200,201\n";
    }

    UserRepository repo = Persistence::load(TEST_FILE_PATH);

    assert(repo.hasUser(1));
    assert(repo.hasUser(2));

    std::set<int> expectedUserOneProducts = {100, 101, 102};
    std::set<int> expectedUserTwoProducts = {200, 201};

    assert(repo.getWatchedProducts(1) == expectedUserOneProducts);
    assert(repo.getWatchedProducts(2) == expectedUserTwoProducts);

    deleteTestFileIfExists();
}

void testShouldIgnoreEmptyLinesWhenLoading() {
    deleteTestFileIfExists();

    {
        std::ofstream file(TEST_FILE_PATH);
        file << "\n";
        file << "1:100,101\n";
        file << "\n";
        file << "2:200\n";
        file << "\n";
    }

    UserRepository repo = Persistence::load(TEST_FILE_PATH);

    assert(repo.hasUser(1));
    assert(repo.hasUser(2));

    std::set<int> expectedUserOneProducts = {100, 101};
    std::set<int> expectedUserTwoProducts = {200};

    assert(repo.getWatchedProducts(1) == expectedUserOneProducts);
    assert(repo.getWatchedProducts(2) == expectedUserTwoProducts);

    deleteTestFileIfExists();
}

void testShouldIgnoreSpacesAroundIdsColonAndCommasWhenLoading() {
    deleteTestFileIfExists();

    {
        std::ofstream file(TEST_FILE_PATH);
        file << "1 : 100, 101, 102\n";
        file << "2: 200 , 201\n";
    }

    UserRepository repo = Persistence::load(TEST_FILE_PATH);

    std::set<int> expectedUserOneProducts = {100, 101, 102};
    std::set<int> expectedUserTwoProducts = {200, 201};

    assert(repo.getWatchedProducts(1) == expectedUserOneProducts);
    assert(repo.getWatchedProducts(2) == expectedUserTwoProducts);

    deleteTestFileIfExists();
}

void testShouldRemoveDuplicateProductsWhenLoading() {
    deleteTestFileIfExists();

    {
        std::ofstream file(TEST_FILE_PATH);
        file << "1:100,100,101,101,102\n";
    }

    UserRepository repo = Persistence::load(TEST_FILE_PATH);

    std::set<int> expectedProducts = {100, 101, 102};

    assert(repo.getWatchedProducts(1) == expectedProducts);

    deleteTestFileIfExists();
}

void testShouldMergeDuplicateUsersWhenLoading() {
    deleteTestFileIfExists();

    {
        std::ofstream file(TEST_FILE_PATH);
        file << "1:100,101\n";
        file << "1:102,103\n";
    }

    UserRepository repo = Persistence::load(TEST_FILE_PATH);

    std::set<int> expectedProducts = {100, 101, 102, 103};

    assert(repo.getWatchedProducts(1) == expectedProducts);

    deleteTestFileIfExists();
}

void testShouldIgnoreInvalidLinesWhenLoading() {
    deleteTestFileIfExists();

    {
        std::ofstream file(TEST_FILE_PATH);
        file << "abc:100,101\n";
        file << "1:abc\n";
        file << "1:\n";
        file << ":100\n";
        file << "-1:100\n";
        file << "1:-100\n";
        file << "hello world\n";
        file << "2:200,201\n";
    }

    UserRepository repo = Persistence::load(TEST_FILE_PATH);

    assert(!repo.hasUser(1));
    assert(!repo.hasUser(-1));
    assert(repo.hasUser(2));

    std::set<int> expectedProducts = {200, 201};
    assert(repo.getWatchedProducts(2) == expectedProducts);

    deleteTestFileIfExists();
}

void testShouldReturnEmptyRepositoryWhenFileDoesNotExist() {
    deleteTestFileIfExists();

    UserRepository repo = Persistence::load(TEST_FILE_PATH);

    assert(!repo.hasUser(1));
    assert(!repo.hasUser(2));
    assert(repo.getWatchedProducts(1).empty());
}

int main() {
    testShouldSaveUsersToFile();
    testShouldSaveUsersInAscendingUserIdOrder();
    testShouldSaveProductsInAscendingProductIdOrder();

    testShouldLoadUsersFromFile();
    testShouldIgnoreEmptyLinesWhenLoading();
    testShouldIgnoreSpacesAroundIdsColonAndCommasWhenLoading();
    testShouldRemoveDuplicateProductsWhenLoading();
    testShouldMergeDuplicateUsersWhenLoading();
    testShouldIgnoreInvalidLinesWhenLoading();
    testShouldReturnEmptyRepositoryWhenFileDoesNotExist();

    std::cout << "test_persistence passed successfully!" << std::endl;
    return 0;
}
