#include <cassert>
#include "../src/CommandParser.h"

void testEmptyCommandIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("");
    
    assert(result.type == CommandType::Invalid);
}

void testUnknownCommandIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("foo bar baz");
    
    assert(result.type == CommandType::Invalid);
}

void testFakeCommandIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("FAKE 123");
    
    assert(result.type == CommandType::Invalid);
}

void testPostWithTabIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("POST\t123\t456");
    
    assert(result.type == CommandType::Invalid);
}

void testGetWithTabIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("GET\t123\t456");
    
    assert(result.type == CommandType::Invalid);
}

void testDeleteWithTabIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("DELETE\t123\t456");
    
    assert(result.type == CommandType::Invalid);
}

void testPatchWithTabIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("PATCH\t123\t456");
    
    assert(result.type == CommandType::Invalid);
}

void testLeadingSpaceIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand(" POST 123 456");
    
    assert(result.type == CommandType::Invalid);
}

int main() {
    testEmptyCommandIsInvalid();
    testUnknownCommandIsInvalid();
    testFakeCommandIsInvalid();
    testPostWithTabIsInvalid();
    testGetWithTabIsInvalid();
    testDeleteWithTabIsInvalid();
    testPatchWithTabIsInvalid();
    testLeadingSpaceIsInvalid();
    
    return 0;
}