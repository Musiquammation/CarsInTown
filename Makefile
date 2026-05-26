CC = emcc

SRC_DIR = api
BIN_DIR = bin

PRINT ?= 0

SRCS = $(wildcard $(SRC_DIR)/*.c)
OBJS = $(patsubst $(SRC_DIR)/%.c,$(BIN_DIR)/%.o,$(SRCS))
DEPS = $(OBJS:.o=.d)

TARGET = $(BIN_DIR)/api.js

CFLAGS = -I$(SRC_DIR) -MMD -MP -DPRINT_LOGS=$(PRINT)

LDFLAGS = -g3 \
	-Wall -Wextra \
	-s MODULARIZE=1 \
	-s ASSERTIONS=2 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s EXPORT_ES6=1 \
    -s ENVIRONMENT=web \
	-s EXPORTED_FUNCTIONS="['_Api_init','_Api_reserveCars','_Api_getDangers','_Api_cleanup','_Api_addPath','_Api_removePath','_Api_setRoad']" \
	-s EXPORT_NAME="createModule" \
	-s EXPORTED_RUNTIME_METHODS="['ccall','cwrap']"

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(OBJS) -o $@ $(LDFLAGS)

$(BIN_DIR)/%.o: $(SRC_DIR)/%.c | $(BIN_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(BIN_DIR):
	mkdir -p $(BIN_DIR)

-include $(DEPS)

clean:
	rm -rf $(BIN_DIR)

.PHONY: all clean