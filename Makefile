CC = emcc

SRC_DIR = api
BIN_DIR = bin

PRINT ?= 0
SANITIZER ?= 0

SRCS = $(wildcard $(SRC_DIR)/*.c)
OBJS = $(patsubst $(SRC_DIR)/%.c,$(BIN_DIR)/%.o,$(SRCS))
DEPS = $(OBJS:.o=.d)

TARGET = $(BIN_DIR)/api.js

# Base des CFLAGS (compilation des fichiers .c)
CFLAGS = -I$(SRC_DIR) -g -gsource-map -MMD -MP -DPRINT_LOGS=$(PRINT)

# Base des LDFLAGS (linkage final du fichier .js/.wasm)
LDFLAGS = -g3 \
	-Wall -Wextra \
	-s MODULARIZE=1 \
	-s ASSERTIONS=2 \
	-s STACK_OVERFLOW_CHECK=2 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s EXPORT_ES6=1 \
	-s ENVIRONMENT=web \
	-s EXPORTED_FUNCTIONS="['_Api_init','_Api_reserveCars','_Api_getDangers','_Api_cleanup','_Api_addPath','_Api_removePath','_Api_movePath','_Api_setupCars','_Api_cleanupCars']" \
	-s EXPORT_NAME="createModule" \
	-s EXPORTED_RUNTIME_METHODS="['ccall','cwrap']"

# --- Configuration du Mode Debug / Sanitizer ---
ifeq ($(SANITIZER), 1)
	# Activation de l'AddressSanitizer
	SAN_FLAGS = -fsanitize=address
	
	CFLAGS += $(SAN_FLAGS)
	# On utilise -gembed-source-map pour injecter la map directement dans le JS.
	# C'est indispensable pour que Vite / le navigateur retrouvent les lignes du .c
	LDFLAGS += $(SAN_FLAGS) -gembed-source-map
else
	# Mode normal : on utilise la source map classique séparée (.wasm.map)
	LDFLAGS += -gsource-map
endif
# -----------------------------------------------

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