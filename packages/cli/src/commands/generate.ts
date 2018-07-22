import { Command } from '@oclif/command';
import { TemplateGenerator } from '../packages/generator/TemplateGenerator';
import * as path from 'path';
import * as fs from "fs";

import chalk from "chalk";
import { ConfigurationLoader } from '../packages/configuration/ConfigurationLoader';
import { Config } from '../packages/configuration/Config';

export class GenerateCommand extends Command {
    static description = "Command used to generate controllers, entities, etc...";

    static args = [
        {
            name: 'type',
            required: true,
            description: 'type of the component that will be generated',
            options: [
                'entity',
                'controller',
                'json-controller'
            ]
        },
        {
            name: 'name',
            required: true,
            description: 'name of the component that will be generated'
        }
    ];

    async run(): Promise<any> {
        let { args } = this.parse(GenerateCommand);
        let { type, name } = args;
        let config: any;

        try {
            config = ConfigurationLoader.export();
        } catch(ex) {
            this.warn("Could not load project configuration. Assuming defaults.");
        }
        
        try {
            let p = fs.readFileSync(path.join(process.cwd(), "package.json"));
        } catch(ex) {
            this.error("Please run the command at the root of the project!");
            this.exit(1);
        }

        let destination = "";
        if(type == 'entity') {
            destination = path.join(process.cwd(), `./${config.paths.app}/model/entities`, name);
        } else if(type == 'controller' || type == 'json-controller') {
            name = name + "Controller";
            destination = path.join(process.cwd(), `./${config.paths.app}/controllers`, name)
        }
        destination += ".ts";
        TemplateGenerator.generateFile(type + ".ts.tp", destination, { name });
        this.log(chalk.green("\tcreated") + "\t" + chalk.white(destination));
    }

}