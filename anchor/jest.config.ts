import type { Config } from 'jest';

const config: Config = {
    transform: {
        '^.+\\.ts?$': 'ts-jest', // Handles TypeScript
    },
    // testEnvironment: 'node',
    // moduleFileExtensions: ["ts", "tsx", "js", "jsx"],

};

export default config;
