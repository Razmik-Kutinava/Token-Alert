# Makefile for Alert Engine C Project
CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -O2 -g
INCLUDES = -Iinclude
LIBS = -lcurl -lcjson -lsqlite3 -lmicrohttpd -lwebsockets -lpthread -lm

# Directories
SRCDIR = src
INCDIR = include
OBJDIR = obj
BINDIR = bin

# Source files
SOURCES = $(wildcard $(SRCDIR)/*.c)
OBJECTS = $(SOURCES:$(SRCDIR)/%.c=$(OBJDIR)/%.o)
TARGET = $(BINDIR)/alert_engine

# Main target
all: directories $(TARGET)

# Create directories
directories:
	@mkdir -p $(OBJDIR) $(BINDIR)

# Build target
$(TARGET): $(OBJECTS)
	$(CC) $(OBJECTS) -o $@ $(LIBS)
	@echo "Build completed: $(TARGET)"

# Compile object files
$(OBJDIR)/%.o: $(SRCDIR)/%.c
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

# Clean build files
clean:
	rm -rf $(OBJDIR) $(BINDIR)
	@echo "Clean completed"

# Install dependencies (Ubuntu/Debian)
install-deps:
	@echo "Installing dependencies..."
	sudo apt-get update
	sudo apt-get install -y \
		build-essential \
		libcurl4-openssl-dev \
		libcjson-dev \
		libsqlite3-dev \
		libmicrohttpd-dev \
		libwebsockets-dev \
		pkg-config
	@echo "Dependencies installed"

# Install dependencies (Windows/MinGW)
install-deps-windows:
	@echo "Installing dependencies for Windows..."
	@echo "Please install the following manually or via vcpkg:"
	@echo "- libcurl"
	@echo "- cjson"
	@echo "- sqlite3"
	@echo "- libmicrohttpd"
	@echo "- libwebsockets"

# Test build
test: $(TARGET)
	@echo "Running basic test..."
	./$(TARGET) --test

# Debug build
debug: CFLAGS += -DDEBUG -g
debug: clean $(TARGET)

# Release build
release: CFLAGS += -O3 -DNDEBUG
release: clean $(TARGET)

# Run the alert engine
run: $(TARGET)
	./$(TARGET)

# Check for memory leaks (requires valgrind)
memcheck: $(TARGET)
	valgrind --leak-check=full --show-leak-kinds=all ./$(TARGET)

# Static analysis (requires cppcheck)
static-analysis:
	cppcheck --enable=all --std=c99 $(SRCDIR)/ $(INCDIR)/

# Format code (requires clang-format)
format:
	find $(SRCDIR) $(INCDIR) -name "*.c" -o -name "*.h" | xargs clang-format -i

# Generate documentation (requires doxygen)
docs:
	doxygen Doxyfile

# Print help
help:
	@echo "Available targets:"
	@echo "  all           - Build the project (default)"
	@echo "  clean         - Remove build files"
	@echo "  install-deps  - Install dependencies (Linux)"
	@echo "  test          - Build and run basic tests"
	@echo "  debug         - Build debug version"
	@echo "  release       - Build optimized release version"
	@echo "  run           - Build and run the alert engine"
	@echo "  memcheck      - Run with valgrind memory checker"
	@echo "  static-analysis - Run static code analysis"
	@echo "  format        - Format source code"
	@echo "  docs          - Generate documentation"
	@echo "  help          - Show this help"

.PHONY: all clean install-deps install-deps-windows test debug release run memcheck static-analysis format docs help directories