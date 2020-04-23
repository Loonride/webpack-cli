'use strict';

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const { run, runAndGetWatchProc, runPromptWithAnswers } = require('../../utils/test-utils');

const ENTER = '\x0D';
const outputDir = 'test-assets';
const outputPath = path.join(__dirname, outputDir);
const outputFile = `${outputDir}/updated-webpack.config.js`;
const outputFilePath = path.join(__dirname, outputFile);

describe('migrate command', () => {
    beforeEach(() => {
        rimraf.sync(outputPath);
        fs.mkdirSync(outputPath);
    });

    afterAll(() => {
        rimraf.sync(outputPath);
    });

    it('should warn if the source config file is not specified', () => {
        const { stderr } = run(__dirname, ['migrate'], false);
        expect(stderr).toContain('Please specify a path to your webpack config');
    });

    it('should prompt accordingly if an output path is not specified', () => {
        const { stdout } = run(__dirname, ['migrate', 'webpack.config.js'], false);
        expect(stdout).toContain('? Migration output path not specified');
    });

    it('should throw an error if the user refused to overwrite the source file and no output path is provided', async () => {
        const { stderr } = await runAndGetWatchProc(__dirname, ['migrate', 'webpack.config.js'], false, 'n');
        expect(stderr).toBe('✖ ︎Migration aborted due no output path');
    });

    it('should prompt for config validation when an output path is provided', async () => {
        const { stdout } = await runAndGetWatchProc(__dirname, ['migrate', 'webpack.config.js', outputFile], false, 'y');
        expect(stdout).toContain('? Do you want to validate your configuration?');
    });

    it('should generate an updated config file when an output path is provided', async () => {
        const { stdout, stderr } = await runPromptWithAnswers(__dirname, ['migrate', 'webpack.config.js', outputFile], [ENTER, ENTER]);
        expect(stdout).toContain('? Do you want to validate your configuration?');
        expect(stderr).toBeFalsy();

        expect(fs.existsSync(outputFilePath)).toBeTruthy();
    });

    it('should generate an updated config file and warn of an invalid webpack config', async () => {
        const { stdout, stderr } = await runPromptWithAnswers(__dirname, ['migrate', 'bad-webpack.config.js', outputFile], [ENTER, ENTER]);
        expect(stdout).toContain('? Do you want to validate your configuration?');
        expect(stderr).toContain("configuration.output has an unknown property 'badOption'");

        expect(fs.existsSync(outputFilePath)).toBeTruthy();
    });
});
