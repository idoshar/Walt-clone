#include <cassert>
#include "../src/CommandParser.h"

void testValidDeleteCommandWithTwoProducts() {
    CommandParser parser;
    Command result = parser.parseCommand("DELETE 123 456 789");
    
    assert(result.type == CommandType::Delete);
    assert(result.userId == 123);
    assert(result.productIds.size() == 2);
    assert(result.productIds[0] == 456);
    assert(result.productIds[1] == 789);
}

void testValidDeleteCommandWithSingleProduct() {
    CommandParser parser;
    Command result = parser.parseCommand("DELETE 123 456");
    
    assert(result.type == CommandType::Delete);
    assert(result.userId == 123);
    assert(result.productIds.size() == 1);
    assert(result.productIds[0] == 456);
}

void testValidDeleteCommandWithManyProducts() {
    CommandParser parser;
    Command result = parser.parseCommand("DELETE 1 2 3 4 5 6 7 8 9 10");
    
    assert(result.type == CommandType::Delete);
    assert(result.userId == 1);
    assert(result.productIds.size() == 9);
}

void testDeleteCommandWithMultipleSpaces() {
    CommandParser parser;
    Command result = parser.parseCommand("DELETE   123   456   789");
    
    assert(result.type == CommandType::Delete);
    assert(result.userId == 123);
    assert(result.productIds.size() == 2);
}

void testDeleteCommandWithoutArgumentsIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("DELETE");
    
    assert(result.type == CommandType::Invalid);
}

void testDeleteCommandWithOnlyUserIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("DELETE 123");
    
    assert(result.type == CommandType::Invalid);
}

void testDeleteCommandWithZeroUserIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("DELETE 0 456 789");
    
    assert(result.type == CommandType::Invalid);
}

void testDeleteCommandWithZeroProductIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("DELETE 123 0 789");
    
    assert(result.type == CommandType::Invalid);
}

void testDeleteCommandWithNonNumericUserIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("DELETE abc 456 789");
    
    assert(result.type == CommandType::Invalid);
}

void testDeleteCommandWithTabsIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("DELETE\t123\t456\t789");
    
    assert(result.type == CommandType::Invalid);
}

void testDeleteCommandWithLeadingSpaceIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand(" DELETE 123 456");
    
    assert(result.type == CommandType::Invalid);
}

int main() {
    testValidDeleteCommandWithTwoProducts();
    testValidDeleteCommandWithSingleProduct();
    testValidDeleteCommandWithManyProducts();
    testDeleteCommandWithMultipleSpaces();
    testDeleteCommandWithoutArgumentsIsInvalid();
    testDeleteCommandWithOnlyUserIdIsInvalid();
    testDeleteCommandWithZeroUserIdIsInvalid();
    testDeleteCommandWithZeroProductIdIsInvalid();
    testDeleteCommandWithNonNumericUserIdIsInvalid();
    testDeleteCommandWithTabsIsInvalid();
    testDeleteCommandWithLeadingSpaceIsInvalid();
    
    return 0;
}