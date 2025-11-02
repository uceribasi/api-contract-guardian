#!/usr/bin/env node
import { Command } from 'commander';
import { scanCode } from './modules/code-scanner'
import {getSwaggerPaths} from "./modules/openapi";
import chalk from "chalk";
import {error, log, setLogLevel} from "./shared/logger";
import {getPostmanPaths} from "./modules/postman";
import { Request } from "./shared/interfaces";


const program = new Command();


function convertOpenApiPathToRegex(path: string): RegExp {
    const regexString = path.replace(/{[^/]+}/g, '([^/]+)');
    return new RegExp(`^${regexString}$`);
}

program
    .name('api-guardian')
    .description('Scan repo and validate against OpenAPI')
    .option("-v, --verbose", "enable verbose logging")
    .option("-q, --quiet", "suppress non-error logs");

program
    .command('run')
    .description("Scan repo and validate against OpenAPI")
    .option("--openapi <url>", "OpenAPI URL")
    .option("--postman <path_or_url>", "Postman Collection JSON path or URL")
    .requiredOption("--glob <pattern>", "glob pattern for source files")
    .action(async (cmdOpts, command) => {
        const { verbose, quiet } = program.opts<{ verbose?: boolean; quiet?: boolean }>();
        setLogLevel(!!verbose, !!quiet);
        const { openapi, postman, glob } = cmdOpts;

        if (!openapi && !postman) {
            error(chalk.red.bold('Error: A contract source must be specified.'));
            error(chalk.yellow('Please use either --openapi <url> OR --postman <path_or_url>.'));
            process.exit(1);
        }

        if (openapi && postman) {
            error(chalk.red.bold('Error: You cannot specify multiple contract sources at the same time.'));
            error(chalk.yellow('Please use ONLY --openapi OR ONLY --postman.'));
            process.exit(1);
        }

        try {
            let contractPaths: Request[] = [];

            if (openapi) {
                log(chalk.blue('Reading Swagger (OpenAPI) contract...'));
                contractPaths = await getSwaggerPaths(openapi);
            }

            if (postman) {
                log(chalk.blue('Reading Postman Collection...'));
                contractPaths = await getPostmanPaths(postman);
            }

            if (!contractPaths.length) {
                error(chalk.red.bold('Error: Contract paths not working.'));
            }

            const requests = await scanCode(glob);

            const compiledPaths = contractPaths.map(path => ({
                urlRegex: convertOpenApiPathToRegex(path.url),
                methods: path.method,
            }));

            log(chalk.yellow(`Validation starting: ${requests.length} requests found, ${compiledPaths.length} contract paths loaded.`));

            const errors: string[] = [];

            for (const req of requests) {
                let isValid = false;
                const requestMethod = req.method;
                for (const compiledPath of compiledPaths) {
                    if (compiledPath.urlRegex.test(req.url)) {
                        if (compiledPath.methods.includes(requestMethod)) {
                            isValid = true;
                            log(chalk.green(`  [✓] VALID: ${requestMethod.toUpperCase()} ${req.url}`));                            break;
                        }
                    }
                }

                if (!isValid) {
                    const errorMessage = `ERROR: ${requestMethod.toUpperCase()} ${req.url} was not found in the API contract!`;
                    error(chalk.red(`  [✗] ${errorMessage}`));
                    errors.push(errorMessage);
                }
            }

            if (errors.length > 0) {
                console.error(chalk.red.bold('\n❌ API CONTRACT VIOLATIONS FOUND:'));
                console.error(chalk.red(`Found ${errors.length} non-compliant requests.`));
                process.exit(1);
            } else {
                console.log(chalk.green.bold('\n✅ All API calls are compliant with the contract. You are safe.'));
            }
        }
        catch (err) {
            error(chalk.red(`Critical Error: ${err}`));
            process.exit(1);
        }
    });

program.parse(process.argv);