"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.singletonTemplate = singletonTemplate;
exports.interfaceTemplate = interfaceTemplate;
function singletonTemplate(className) {
    return `<?php

class ${className} {
    private static ?${className} $instance = null;

    private function __construct() {
        // private constructor
    }

    public static function getInstance(): ${className} {
        if (self::$instance === null) {
            self::$instance = new ${className}();
        }
        return self::$instance;
    }

    private function __clone() {}
    private function __wakeup() {}
}`;
}
function interfaceTemplate(interfaceName) {
    return `<?php

interface ${interfaceName} {
    // Define interface methods here
}`;
}
//# sourceMappingURL=phpSnippets.js.map