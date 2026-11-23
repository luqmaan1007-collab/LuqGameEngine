export type LanguageDefinition = {
  id: string;
  label: string;
  extensions: string[];
  monacoId: string;
  runtime: 'external' | 'luau' | 'none';
};

export const languages: LanguageDefinition[] = [
  { id:'typescript', label:'TypeScript', extensions:['.ts','.tsx'], monacoId:'typescript', runtime:'external' },
  { id:'javascript', label:'JavaScript', extensions:['.js','.jsx','.mjs'], monacoId:'javascript', runtime:'external' },
  { id:'luau', label:'Luau', extensions:['.lua','.luau'], monacoId:'luau', runtime:'luau' },
  { id:'lua', label:'Lua', extensions:['.lua'], monacoId:'lua', runtime:'external' },
  { id:'python', label:'Python', extensions:['.py'], monacoId:'python', runtime:'external' },
  { id:'rust', label:'Rust', extensions:['.rs'], monacoId:'rust', runtime:'external' },
  { id:'c', label:'C', extensions:['.c','.h'], monacoId:'c', runtime:'external' },
  { id:'cpp', label:'C++', extensions:['.cc','.cpp','.hpp'], monacoId:'cpp', runtime:'external' },
  { id:'csharp', label:'C#', extensions:['.cs'], monacoId:'csharp', runtime:'external' },
  { id:'java', label:'Java', extensions:['.java'], monacoId:'java', runtime:'external' },
  { id:'kotlin', label:'Kotlin', extensions:['.kt','.kts'], monacoId:'kotlin', runtime:'external' },
  { id:'swift', label:'Swift', extensions:['.swift'], monacoId:'swift', runtime:'external' },
  { id:'go', label:'Go', extensions:['.go'], monacoId:'go', runtime:'external' },
  { id:'ruby', label:'Ruby', extensions:['.rb'], monacoId:'ruby', runtime:'external' },
  { id:'php', label:'PHP', extensions:['.php'], monacoId:'php', runtime:'external' },
  { id:'html', label:'HTML', extensions:['.html'], monacoId:'html', runtime:'none' },
  { id:'css', label:'CSS', extensions:['.css'], monacoId:'css', runtime:'none' },
  { id:'scss', label:'SCSS', extensions:['.scss'], monacoId:'scss', runtime:'none' },
  { id:'json', label:'JSON', extensions:['.json'], monacoId:'json', runtime:'none' },
  { id:'yaml', label:'YAML', extensions:['.yml','.yaml'], monacoId:'yaml', runtime:'none' },
  { id:'markdown', label:'Markdown', extensions:['.md'], monacoId:'markdown', runtime:'none' },
  { id:'sql', label:'SQL', extensions:['.sql'], monacoId:'sql', runtime:'external' },
  { id:'shell', label:'Shell', extensions:['.sh','.bash'], monacoId:'shell', runtime:'external' },
  { id:'powershell', label:'PowerShell', extensions:['.ps1'], monacoId:'powershell', runtime:'external' },
  { id:'xml', label:'XML', extensions:['.xml','.svg'], monacoId:'xml', runtime:'none' },
  { id:'dart', label:'Dart', extensions:['.dart'], monacoId:'dart', runtime:'external' },
  { id:'r', label:'R', extensions:['.r'], monacoId:'r', runtime:'external' },
  { id:'perl', label:'Perl', extensions:['.pl'], monacoId:'perl', runtime:'external' },
  { id:'dockerfile', label:'Dockerfile', extensions:['Dockerfile'], monacoId:'dockerfile', runtime:'none' },
  { id:'toml', label:'TOML', extensions:['.toml'], monacoId:'ini', runtime:'none' }
];

export function languageForPath(path: string): LanguageDefinition | undefined {
  return languages.find(language => language.extensions.some(ext => path.endsWith(ext)));
}
