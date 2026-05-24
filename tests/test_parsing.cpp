#include <cassert>
#include <iostream>
#include <vector>
#include <string>

#include "../src/CommandParser.h"

void testShouldParseValidAddCommandWithOneProduct() {
    CommandParser parser;

    Command command = parser.parseCommand("add 1 100");

    assert(command.type == CommandType::Add);
    assert(command.userId == 1);

    std::vector<int> expectedProducts = {100};
    assert(command.productIds == expectedProducts);
}

void testShouldParseValidAddCommandWithMultipleProducts() {
    CommandParser parser;

    Command command = parser.parseCommand("add 1 100 101 102 103");

    assert(command.type == CommandType::Add);
    assert(command.userId == 1);

    std::vector<int> expectedProducts = {100, 101, 102, 103};
    assert(command.productIds == expectedProducts);
}

void testShouldParseAddCommandWithMultipleSpaces() {
    CommandParser parser;

    Command command = parser.parseCommand("add    1     100     101");

    assert(command.type == CommandType::Add);
    assert(command.userId == 1);

    std::vector<int> expectedProducts = {100, 101};
    assert(command.productIds == expectedProducts);
}

void testShouldRejectAddCommandWithoutProducts() {
    CommandParser parser;

    Command command = parser.parseCommand("add 1");

    assert(command.type == CommandType::Invalid);
}

void testShouldRejectAddCommandWithoutUserId() {
    CommandParser parser;

    Command command = parser.parseCommand("add");

    assert(command.type == CommandType::Invalid);
}

void testShouldParseValidRecommendCommand() {
    CommandParser parser;

    Command command = parser.parseCommand("recommend 1 104");

    assert(command.type == CommandType::Recommend);
    assert(command.userId == 1);
    assert(command.productIds.size() == 1);
    assert(command.productIds[0] == 104);
}

void testShouldParseRecommendCommandWithMultipleSpaces() {
    CommandParser parser;

    Command command = parser.parseCommand("recommend     1      104");

    assert(command.type == CommandType::Recommend);
    assert(command.userId == 1);
    assert(command.productIds.size() == 1);
    assert(command.productIds[0] == 104);
}

void testShouldRejectRecommendCommandWithoutProductId() {
    CommandParser parser;

    Command command = parser.parseCommand("recommend 1");

    assert(command.type == CommandType::Invalid);
}

void testShouldRejectRecommendCommandWithTooManyArguments() {
    CommandParser parser;

    Command command = parser.parseCommand("recommend 1 104 105");

    assert(command.type == CommandType::Invalid);
}

void testShouldParseHelpCommand() {
    CommandParser parser;

    Command command = parser.parseCommand("help");

    assert(command.type == CommandType::Help);
}

void testShouldRejectHelpCommandWithExtraArguments() {
    CommandParser parser;

    Command command = parser.parseCommand("help now");

    assert(command.type == CommandType::Invalid);
}

void testShouldRejectUnknownCommand() {
    CommandParser parser;

    Command command = parser.parseCommand("foo 1 2 3");

    assert(command.type == CommandType::Invalid);
}

void testShouldRejectEmptyLine() {
    CommandParser parser;

    Command command = parser.parseCommand("");

    assert(command.type == CommandType::Invalid);
}

void testShouldRejectLineWithOnlySpaces() {
    CommandParser parser;

    Command command = parser.parseCommand("       ");

    assert(command.type == CommandType::Invalid);
}

void testShouldRejectTabs() {
    CommandParser parser;

    Command command = parser.parseCommand("add\t1\t100");

    assert(command.type == CommandType::Invalid);
}

void testShouldRejectNonNumericUserId() {
    CommandParser parser;

    Command command = parser.parseCommand("add abc 100");

    assert(command.type == CommandType::Invalid);
}

void testShouldRejectNonNumericProductId() {
    CommandParser parser;

    Command command = parser.parseCommand("add 1 abc");

    assert(command.type == CommandType::Invalid);
}

void testShouldRejectNegativeUserId() {
    CommandParser parser;

    Command command = parser.parseCommand("add -1 100");

    assert(command.type == CommandType::Invalid);
}

void testShouldRejectNegativeProductId() {
    CommandParser parser;

    Command command = parser.parseCommand("add 1 -100");

    assert(command.type == CommandType::Invalid);
}

int main() {
    testShouldParseValidAddCommandWithOneProduct();
    testShouldParseValidAddCommandWithMultipleProducts();
    testShouldParseAddCommandWithMultipleSpaces();
    testShouldRejectAddCommandWithoutProducts();
    testShouldRejectAddCommandWithoutUserId();

    testShouldParseValidRecommendCommand();
    testShouldParseRecommendCommandWithMultipleSpaces();
    testShouldRejectRecommendCommandWithoutProductId();
    testShouldRejectRecommendCommandWithTooManyArguments();

    testShouldParseHelpCommand();
    testShouldRejectHelpCommandWithExtraArguments();

    testShouldRejectUnknownCommand();
    testShouldRejectEmptyLine();
    testShouldRejectLineWithOnlySpaces();
    testShouldRejectTabs();

    testShouldRejectNonNumericUserId();
    testShouldRejectNonNumericProductId();
    testShouldRejectNegativeUserId();
    testShouldRejectNegativeProductId();

    std::cout << "test_parsing passed successfully!" << std::endl;
    return 0;
}
