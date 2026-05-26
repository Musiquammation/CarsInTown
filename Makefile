CC = emcc

SRC_DIR = api
BIN_DIR = bin

SRCS = $(wildcard $(SRC_DIR)/*.c)
OBJS = $(patsubst $(SRC_DIR)/%.c,$(BIN_DIR)/%.o,$(SRCS))
DEPS = $(OBJS:.o=.d)

TARGET = $(BIN_DIR)/api.js

CFLAGS = -O2 -I$(SRC_DIR) -MMD -MP

LDFLAGS = -O2 \
	-s WASM=1 \
	-s MODULARIZE=1 \
	-s EXPORT_ES6=1 \
	-s EXPORTED_FUNCTIONS="['_Api_init','_Api_reserveCars','_Api_getDangers','_Api_cleanup','_Api_addPath','_Api_removePath']"\
	-s EXPORT_NAME="createModule" \
	-s EXPORTED_RUNTIME_METHODS="['ccall','cwrap']"

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(OBJS) -o $@ $(LDFLAGS)

$(BIN_DIR)/%.o: $(SRC_DIR)/%.c | $(BIN_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(BIN_DIR):
	mkdir -p $(BIN_DIR)

# 👇 IMPORTANT : inclut les dépendances headers
-include $(DEPS)

clean:
	rm -rf $(BIN_DIR)

.PHONY: all clean
