#include <cassert>
#include "../src/CommandParser.h"

void testValidPatchCommandWithTwoProducts() {
    CommandParser parser;
    Command result = parser.parseCommand("PATCH 123 456 789");
    
    assert(result.type == CommandType::Patch);
    assert(result.userId == 123);
    assert(result.productIds.size() == 2);
    assert(result.productIds[0] == 456);
    assert(result.productIds[1] == 789);
}

void testValidPatchCommandWithSingleProduct() {
    CommandParser parser;
    Command result = parser.parseCommand("PATCH 123 456");
    
    assert(result.type == CommandType::Patch);
    assert(result.userId == 123);
    assert(result.productIds.size() == 1);
    assert(result.productIds[0] == 456);
}

void testPatchCommandWithoutArgumentsIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("PATCH");
    
    assert(result.type == CommandType::Invalid);
}

void testPatchCommandWithOnlyUserIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("PATCH 123");
    
    assert(result.type == CommandType::Invalid);
}

void testPatchCommandWithZeroUserIdIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("PATCH 0 456");
    
    assert(result.type == CommandType::Invalid);
}

int main() {
    testValidPatchCommandWithTwoProducts();
    testValidPatchCommandWithSingleProduct();
    testPatchCommandWithoutArgumentsIsInvalid();
    testPatchCommandWithOnlyUserIdIsInvalid();
    testPatchCommandWithZeroUserIdIsInvalid();
    
    return 0;
}