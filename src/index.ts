import { Command } from 'commander';
const program = new Command();
import { scanCode } from './modules/code-scanner'
import {getSwaggerPaths} from "./modules/openapi";
import chalk from "chalk";
import {error, log, setLogLevel} from "./shared/logger";

function convertOpenApiPathToRegex(path: string): RegExp {
    const regexString = path.replace(/{[^/]+}/g, '([^/]+)');
    return new RegExp(`^${regexString}$`);
}

export const initialTestProjectFolder = '{project-folder/src,src,app}/**/*.{js,jsx,ts,tsx}';
export const initialSwaggerPath = 'https://rest.coincap.io/api-docs.json';

program
    .name('api-guardian')
    .description('Scan repo and validate against OpenAPI')
    .option("-v, --verbose", "enable verbose logging")
    .option("-q, --quiet", "suppress non-error logs");

program
    .command('run')
    .description("Scan repo and validate against OpenAPI")
    .option("--openapi <url>", "OpenAPI URL", initialSwaggerPath)
    .option("--glob <pattern>", "glob pattern for source files", initialTestProjectFolder)
    .action(async (cmdOpts, command) => {
        const { verbose, quiet } = program.opts<{ verbose?: boolean; quiet?: boolean }>();
        setLogLevel(!!verbose, !!quiet);

        try {
            log(chalk.blue('Reading Swagger (OpenAPI) contract...'));
            const swaggerPaths = await getSwaggerPaths(initialSwaggerPath);

            log(chalk.blue('Scanning code...'));
            const requests = await scanCode(swaggerPaths.basePath);


            const compiledPaths = swaggerPaths.paths.map(path => ({
                urlRegex: convertOpenApiPathToRegex(path.url),
                methods: path.method,
            }));

            log(chalk.yellow(`Validation starting: ${requests.length} requests found, ${compiledPaths.length} contract paths loaded.`));

            const errors: string[] = [];

            for (const req of requests) {
                let isValid = false;
                const requestMethod = req.method;
                const requestUrl = req.url.endsWith('/') ? req.url.slice(0, -1) : req.url;
                for (const compiledPath of compiledPaths) {
                    if (compiledPath.urlRegex.test(requestUrl)) {
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