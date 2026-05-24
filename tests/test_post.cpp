#include <cassert>
#include "../src/CommandParser.h"

void testValidPostCommandWithTwoProducts() {
    CommandParser parser;
    Command result = parser.parseCommand("POST 123 456 789");
    
    assert(result.type == CommandType::Post);
    assert(result.userId == 123);
    assert(result.productIds.size() == 2);
    assert(result.productIds[0] == 456);
    assert(result.productIds[1] == 789);
}

void testValidPostCommandWithManyProducts() {
    CommandParser parser;
    Command result = parser.parseCommand("POST 1 2 3 4 5 6 7 8 9 10");
    
    assert(result.type == CommandType::Post);
    assert(result.userId == 1);
    assert(result.productIds.size() == 9);
}

void testPostCommandWithMultipleSpaces() {
    CommandParser parser;
    Command result = parser.parseCommand("POST   123   456   789");
    
    assert(result.type == CommandType::Post);
    assert(result.userId == 123);
    assert(result.productIds.size() == 2);
}

void testPostCommandWithoutArgumentsIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("POST");
    
    assert(result.type == CommandType::Invalid);
}

void testPostCommandWithOnlyUserIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("POST 123");
    
    assert(result.type == CommandType::Invalid);
}

void testPostCommandWithZeroUserIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("POST 0 456 789");
    
    assert(result.type == CommandType::Invalid);
}

void testPostCommandWithZeroProductIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("POST 123 0 789");
    
    assert(result.type == CommandType::Invalid);
}

void testPostCommandWithNonNumericUserIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("POST abc 456 789");
    
    assert(result.type == CommandType::Invalid);
}

void testPostCommandWithTabsIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("POST\t123\t456\t789");
    
    assert(result.type == CommandType::Invalid);
}

void testPostCommandWithLeadingSpaceIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand(" POST 123 456");
    
    assert(result.type == CommandType::Invalid);
}

int main() {
    testValidPostCommandWithTwoProducts();
    testValidPostCommandWithManyProducts();
    testPostCommandWithMultipleSpaces();
    testPostCommandWithoutArgumentsIsInvalid();
    testPostCommandWithOnlyUserIdIsInvalid();
    testPostCommandWithZeroUserIdIsInvalid();
    testPostCommandWithZeroProductIdIsInvalid();
    testPostCommandWithNonNumericUserIdIsInvalid();
    testPostCommandWithTabsIsInvalid();
    testPostCommandWithLeadingSpaceIsInvalid();
    
    return 0;
}