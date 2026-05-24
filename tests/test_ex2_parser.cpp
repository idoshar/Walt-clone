#include <cassert>
#include "../src/CommandParser.h"

static void testPost() {
    CommandParser parser;
    Command command = parser.parseCommand("POST 1 100 101");
    assert(command.type == CommandType::Post);
    assert(command.userId == 1);
    assert(command.productIds.size() == 2);
    assert(command.productIds[0] == 100);
    assert(command.productIds[1] == 101);
}

static void testPatch() {
    CommandParser parser;
    Command command = parser.parseCommand("PATCH 2 200");
    assert(command.type == CommandType::Patch);
    assert(command.userId == 2);
    assert(command.productIds.size() == 1);
    assert(command.productIds[0] == 200);
}

static void testDelete() {
    CommandParser parser;
    Command command = parser.parseCommand("DELETE 3 300 301");
    assert(command.type == CommandType::Delete);
    assert(command.userId == 3);
    assert(command.productIds.size() == 2);
}

static void testGet() {
    CommandParser parser;
    Command command = parser.parseCommand("GET 4 400");
    assert(command.type == CommandType::Get);
    assert(command.userId == 4);
    assert(command.productIds.size() == 1);
    assert(command.productIds[0] == 400);
}

static void testHelp() {
    CommandParser parser;
    Command command = parser.parseCommand("help");
    assert(command.type == CommandType::Help);
}

static void testInvalidOldCommands() {
    CommandParser parser;
    assert(parser.parseCommand("add 1 2").type == CommandType::Invalid);
    assert(parser.parseCommand("recommend 1 2").type == CommandType::Invalid);
}

static void testInvalidSyntax() {
    CommandParser parser;
    assert(parser.parseCommand(" POST 1 2").type == CommandType::Invalid);
    assert(parser.parseCommand("POST").type == CommandType::Invalid);
    assert(parser.parseCommand("POST 1").type == CommandType::Invalid);
    assert(parser.parseCommand("GET 1").type == CommandType::Invalid);
    assert(parser.parseCommand("GET 1 2 3").type == CommandType::Invalid);
    assert(parser.parseCommand("help ").type == CommandType::Invalid);
}

int main() {
    testPost();
    testPatch();
    testDelete();
    testGet();
    testHelp();
    testInvalidOldCommands();
    testInvalidSyntax();
    return 0;
}
