export function singletonTemplate(className: string): string {
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

export function interfaceTemplate(interfaceName: string): string {
    return `<?php

interface ${interfaceName} {
    // Define interface methods here
}`;
}
