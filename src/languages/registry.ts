export type LanguageDefinition = { id: string; label: string; extensions: string[]; monacoId: string; runtime: 'external' | 'luau' | 'none' };
export const languages: LanguageDefinition[] = [
  ['typescript','TypeScript',['.ts','.tsx'],'typescript'],['javascript','JavaScript',['.js','.jsx'],'javascript'],
  ['luau','Luau',['.lua','.luau'],'lua'],['lua','Lua',['.lua'],'lua'],
  ['python','Python',['.py'],'python'],['rust','Rust',['.rs'],'rust'],['c','C',['.c','.h'],'c'],
  ['cpp','C++',['.cc','.cpp','.hpp'],'cpp'],['csharp','C#',['.cs'],'csharp'],['java','Java',['.java'],'java'],
  ['kotlin','Kotlin',['.kt','.kts'],'kotlin'],['swift','Swift',['.swift'],'swift'],['go','Go',['.go'],'go'],
  ['ruby','Ruby',['.rb'],'ruby'],['php','PHP',['.php'],'php'],['html','HTML',['.html'],'html'],
  ['css','CSS',['.css'],'css'],['scss','SCSS',['.scss'],'scss'],['json','JSON',['.json'],'json'],
  ['yaml','YAML',['.yml','.yaml'],'yaml'],['markdown','Markdown',['.md'],'markdown'],
  ['sql','SQL',['.sql'],'sql'],['shell','Shell',['.sh','.bash'],'shell'],
  ['powershell','PowerShell',['.ps1'],'powershell'],['xml','XML',['.xml','.svg'],'xml'],
  ['dart','Dart',['.dart'],'dart'],['r','R',['.r'],'r'],['perl','Perl',['.pl'],'perl'],
  ['dockerfile','Dockerfile',['Dockerfile'],'dockerfile'],['toml','TOML',['.toml'],'ini']
].map(([id,label,extensions,monacoId]) => ({id,label,extensions,monacoId,runtime:id==='luau'?'luau':'external'} as LanguageDefinition));
export function languageForPath(path: string): LanguageDefinition | undefined {
  return languages.find(language => language.extensions.some(ext => path.endsWith(ext)));
}
