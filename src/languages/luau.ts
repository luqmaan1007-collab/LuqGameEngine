import * as monaco from 'monaco-editor';

export function registerLuau(): void {
  monaco.languages.register({ id: 'luau', extensions: ['.lua', '.luau'], aliases: ['Luau', 'luau'] });
  monaco.languages.setMonarchTokensProvider('luau', {
    keywords: ['and','break','continue','do','else','elseif','end','export','false','for','function','if','in','local','nil','not','or','repeat','return','then','true','type','until','while'],
    builtins: ['assert','collectgarbage','error','getmetatable','ipairs','next','pairs','pcall','print','rawequal','rawget','rawlen','rawset','select','setmetatable','tonumber','tostring','type','typeof','unpack','xpcall','game','workspace','script','Instance','Vector3','CFrame','Color3','UDim2','task'],
    tokenizer: {
      root: [
        [/[a-zA-Z_][\w]*/, { cases: { '@keywords': 'keyword', '@builtins': 'type.identifier', '@default': 'identifier' } }],
        [/[{}()\[\]]/, '@brackets'], [/[<>](?!@symbols)/, '@brackets'],
        [/@\w+/, 'annotation'], [/--.*$/, 'comment'], [/\d+(\.\d+)?/, 'number'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'], [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/"([^"\\]|\\.)*"/, 'string'], [/'([^'\\]|\\.)*'/, 'string'],
        [/[;,.]/, 'delimiter'], [/[=+\-*\/%#^~]/, 'operator']
      ]
    }
  });
  monaco.languages.setLanguageConfiguration('luau', {
    comments: { lineComment: '--', blockComment: ['--[[', ']]'] },
    brackets: [['{','}'],['[',']'],['(',')']],
    autoClosingPairs: [{open:'{',close:'}'},{open:'[',close:']'},{open:'(',close:')'},{open:'"',close:'"'},{open:"'",close:"'"}]
  });
}
