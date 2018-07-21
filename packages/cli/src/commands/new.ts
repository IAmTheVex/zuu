import { Command } from '@oclif/command';
import { TemplateGenerator } from '../packages/generator/TemplateGenerator';
import * as path from 'path';
import * as fs from "fs";

import chalk from "chalk";
import cli from "cli-ux";

export class NewCommand extends Command {
    static description = "Command used to generate controllers, entities, etc...";

    static args = [
        {
            name: 'type',
            required: true,
            description: 'type of the component that will be generated',
            options: [
                'simple',
                'authed'
            ]
        },
        {
            name: 'name',
            required: true,
            description: 'name of the component that will be generated'
        }
    ];

    async run(): Promise<any> {
        let { args } = this.parse(NewCommand);
        let { type, name } = args;

        try {
            let x = fs.readdirSync(path.join(process.cwd(), name));
            this.error("Can't create a project inside an existing directory!");
        } catch(ex) { }
        
        let author = await cli.prompt("What's the name of the author?");
        let repository = await cli.prompt("The git repository of the project?");
        let license = await cli.prompt("What time of license do you want? (MIT)");

        let source = path.join(__dirname, `../../templates/project/${type}`);
        fs.mkdirSync(path.join(process.cwd(), name));
        this.createDirectoryContents(source, path.join(process.cwd(), name), {name, author, license, repository});
    }

    private createDirectoryContents (templatePath: string, newProjectPath: string, context: any) {
        const filesToCreate = fs.readdirSync(templatePath);
      
        filesToCreate.forEach(file => {
          const origFilePath = `${templatePath}/${file}`;
          
          const stats = fs.statSync(origFilePath);      
          if (stats.isFile()) {
            let comp = file.split(".");
            if(comp[comp.length - 1] == "tp") {
                comp.pop(); file = comp.join(".");
                TemplateGenerator.generateFile(`${templatePath}/${file}.tp`, `${newProjectPath}/${file}`, context, true);
                this.log(chalk.green("\tcreated") + "\t" + chalk.white(`${newProjectPath}/${file}`));
            } else {
                const contents = fs.readFileSync(origFilePath, 'utf8');
                const writePath = `${newProjectPath}/${file}`;
                fs.writeFileSync(writePath, contents, 'utf8');
                this.log(chalk.green("\tcreated") + "\t" + chalk.white(writePath));                
            }
          } else if (stats.isDirectory()) {
            this.log(chalk.magenta("\tnew directory") + "\t" + `${newProjectPath}/${file}`);
            fs.mkdirSync(`${newProjectPath}/${file}`);
            this.createDirectoryContents(`${templatePath}/${file}`, `${newProjectPath}/${file}`, context);
          }
        });
      }

}
