#include <cassert>
#include "../src/CommandParser.h"

void testValidGetCommand() {
    CommandParser parser;
    Command result = parser.parseCommand("GET 123 456");
    
    assert(result.type == CommandType::Get);
    assert(result.userId == 123);
    assert(result.productIds.size() == 1);
    assert(result.productIds[0] == 456);
}

void testGetCommandWithMultipleSpaces() {
    CommandParser parser;
    Command result = parser.parseCommand("GET   123   456");
    
    assert(result.type == CommandType::Get);
    assert(result.userId == 123);
    assert(result.productIds[0] == 456);
}

void testGetCommandWithoutArgumentsIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("GET");
    
    assert(result.type == CommandType::Invalid);
}

void testGetCommandWithOnlyUserIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("GET 123");
    
    assert(result.type == CommandType::Invalid);
}

void testGetCommandWithTooManyArgumentsIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("GET 123 456 789");
    
    assert(result.type == CommandType::Invalid);
}

void testGetCommandWithZeroUserIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("GET 0 456");
    
    assert(result.type == CommandType::Invalid);
}

void testGetCommandWithZeroProductIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("GET 123 0");
    
    assert(result.type == CommandType::Invalid);
}

void testGetCommandWithNonNumericUserIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("GET abc 456");
    
    assert(result.type == CommandType::Invalid);
}

void testGetCommandWithNonNumericProductIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("GET 123 abc");
    
    assert(result.type == CommandType::Invalid);
}

void testGetCommandWithTabsIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("GET\t123\t456");
    
    assert(result.type == CommandType::Invalid);
}

void testGetCommandWithLeadingSpaceIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand(" GET 123 456");
    
    assert(result.type == CommandType::Invalid);
}

int main() {
    testValidGetCommand();
    testGetCommandWithMultipleSpaces();
    testGetCommandWithoutArgumentsIsInvalid();
    testGetCommandWithOnlyUserIdIsInvalid();
    testGetCommandWithTooManyArgumentsIsInvalid();
    testGetCommandWithZeroUserIdIsInvalid();
    testGetCommandWithZeroProductIdIsInvalid();
    testGetCommandWithNonNumericUserIdIsInvalid();
    testGetCommandWithNonNumericProductIdIsInvalid();
    testGetCommandWithTabsIsInvalid();
    testGetCommandWithLeadingSpaceIsInvalid();
    
    return 0;
}