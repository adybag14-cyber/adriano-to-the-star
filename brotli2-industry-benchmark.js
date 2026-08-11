/**
 * Brotli2 Industry Standard Benchmark
 * 
 * Tests Brotli2 against industry-standard benchmark corpora:
 * - Silesia Corpus
 * - Canterbury Corpus
 * - Calgary Corpus
 * - Comparison with gzip and Brotli
 */

class Brotli2IndustryBenchmark {
    constructor() {
        this.results = [];
        this.compressionAlgorithms = {
            brotli2: null,
            gzip: null,
            brotli: null
        };
    }

    /**
     * Generate Silesia Corpus samples
     * Silesia Corpus is a widely used benchmark for compression algorithms
     */
    generateSilesiaCorpus() {
        const samples = {};
        
        // silesia.tar - 200MB tar file (sample: 10KB)
        samples['silesia.tar'] = this.generateTarData(10 * 1024);
        
        // mozilla - 51MB source code (sample: 10KB)
        samples['mozilla'] = this.generateSourceCode(10 * 1024);
        
        // nci - 33MB human genome data (sample: 10KB)
        samples['nci'] = this.generateGenomeData(10 * 1024);
        
        // ooffice - 6MB OpenOffice document (sample: 10KB)
        samples['ooffice'] = this.generateXMLData(10 * 1024);
        
        // osdb - 10MB database dump (sample: 10KB)
        samples['osdb'] = this.generateSQLData(10 * 1024);
        
        // reymont - 7MB Polish text (sample: 10KB)
        samples['reymont'] = this.generatePolishText(10 * 1024);
        
        // samba - 22MB source code (sample: 10KB)
        samples['samba'] = this.generateSourceCode(10 * 1024);
        
        // sao - 22MB astronomical data (sample: 10KB)
        samples['sao'] = this.generateBinaryData(10 * 1024);
        
        // webster - 3MB dictionary (sample: 10KB)
        samples['webster'] = this.generateDictionaryData(10 * 1024);
        
        // x-ray - 8MB medical image (sample: 10KB)
        samples['x-ray'] = this.generateMedicalImageData(10 * 1024);
        
        // xml - 1MB XML data (sample: 10KB)
        samples['xml'] = this.generateXMLData(10 * 1024);
        
        return samples;
    }

    /**
     * Generate Canterbury Corpus samples
     */
    generateCanterburyCorpus() {
        const samples = {};
        
        // alice29.txt - 152KB Alice in Wonderland
        samples['alice29.txt'] = this.generateAliceInWonderland();
        
        // asyoulik.txt - 125KB Shakespeare
        samples['asyoulik.txt'] = this.generateShakespeareText();
        
        // cp.html - 24KB HTML
        samples['cp.html'] = this.generateLargeHTML();
        
        // fields.c - 11KB C source code
        samples['fields.c'] = this.generateCSourceCode();
        
        // grammar.lsp - 3KB Lisp code
        samples['grammar.lsp'] = this.generateLispCode();
        
        // kennedy.xls - 1MB Excel file (sample: 10KB)
        samples['kennedy.xls'] = this.generateExcelData(10 * 1024);
        
        // lcet10.txt - 426KB technical writing
        samples['lcet10.txt'] = this.generateTechnicalWriting();
        
        // plrabn12.txt - 481KB Paradise Lost
        samples['plrabn12.txt'] = this.generateParadiseLost();
        
        // ptt5 - 513KB terminal data
        samples['ptt5'] = this.generateTerminalData(10 * 1024);
        
        // sum - 38KB C source code
        samples['sum'] = this.generateCSourceCode();
        
        // xargs.1 - 4KB man page
        samples['xargs.1'] = this.generateManPage();
        
        return samples;
    }

    /**
     * Generate Calgary Corpus samples
     */
    generateCalgaryCorpus() {
        const samples = {};
        
        // bib - 111KB bibliography
        samples['bib'] = this.generateBibliography();
        
        // book1 - 768KB text
        samples['book1'] = this.generateBookText();
        
        // book2 - 610KB text
        samples['book2'] = this.generateBookText();
        
        // geo - 102KB seismic data
        samples['geo'] = this.generateSeismicData();
        
        // news - 377KB news text
        samples['news'] = this.generateNewsText();
        
        // obj1 - 21KB object code
        samples['obj1'] = this.generateObjectCode();
        
        // obj2 - 246KB object code
        samples['obj2'] = this.generateObjectCode();
        
        // paper1 - 53KB research paper
        samples['paper1'] = this.generateResearchPaper();
        
        // paper2 - 82KB research paper
        samples['paper2'] = this.generateResearchPaper();
        
        // pic - 513KB picture
        samples['pic'] = this.generatePictureData();
        
        // progc - 39KB C source code
        samples['progc'] = this.generateCSourceCode();
        
        // progl - 71KB Lisp source code
        samples['progl'] = this.generateLispCode();
        
        // progp - 49KB Pascal source code
        samples['progp'] = this.generatePascalCode();
        
        // trans - 93KB transcript
        samples['trans'] = this.generateTranscript();
        
        return samples;
    }

    /**
     * Helper methods to generate sample data
     */
    generateTarData(size) {
        const data = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    generateSourceCode(size) {
        const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export'];
        const data = new Uint8Array(size);
        let pos = 0;
        
        while (pos < size) {
            const keyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encoded = new TextEncoder().encode(keyword + ' ');
            for (let i = 0; i < encoded.length && pos < size; i++) {
                data[pos++] = encoded[i];
            }
        }
        
        return data;
    }

    generateGenomeData(size) {
        const bases = ['A', 'C', 'G', 'T', 'N'];
        const data = new Uint8Array(size);
        let pos = 0;
        
        while (pos < size) {
            const base = bases[Math.floor(Math.random() * bases.length)];
            const encoded = new TextEncoder().encode(base);
            for (let i = 0; i < encoded.length && pos < size; i++) {
                data[pos++] = encoded[i];
            }
        }
        
        return data;
    }

    generateXMLData(size) {
        const tags = ['<root>', '<item>', '<data>', '<value>', '</root>', '</item>', '</data>', '</value>'];
        const data = new Uint8Array(size);
        let pos = 0;
        
        while (pos < size) {
            const tag = tags[Math.floor(Math.random() * tags.length)];
            const encoded = new TextEncoder().encode(tag);
            for (let i = 0; i < encoded.length && pos < size; i++) {
                data[pos++] = encoded[i];
            }
        }
        
        return data;
    }

    generateSQLData(size) {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'INDEX'];
        const data = new Uint8Array(size);
        let pos = 0;
        
        while (pos < size) {
            const keyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encoded = new TextEncoder().encode(keyword + ' ');
            for (let i = 0; i < encoded.length && pos < size; i++) {
                data[pos++] = encoded[i];
            }
        }
        
        return data;
    }

    generatePolishText(size) {
        const words = ['w', 'i', 'z', 'a', 'o', 'do', 'na', 'przez', 'pod', 'nad'];
        const data = new Uint8Array(size);
        let pos = 0;
        
        while (pos < size) {
            const word = words[Math.floor(Math.random() * words.length)];
            const encoded = new TextEncoder().encode(word + ' ');
            for (let i = 0; i < encoded.length && pos < size; i++) {
                data[pos++] = encoded[i];
            }
        }
        
        return data;
    }

    generateBinaryData(size) {
        const data = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    generateDictionaryData(size) {
        const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'definition', 'meaning'];
        const data = new Uint8Array(size);
        let pos = 0;
        
        while (pos < size) {
            const word = words[Math.floor(Math.random() * words.length)];
            const encoded = new TextEncoder().encode(word + ': ');
            for (let i = 0; i < encoded.length && pos < size; i++) {
                data[pos++] = encoded[i];
            }
        }
        
        return data;
    }

    generateMedicalImageData(size) {
        const data = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    generateAliceInWonderland() {
        const text = 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, \'and what is the use of a book,\' thought Alice \'without pictures or conversation?\'\n\nSo she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.\n\nThere was nothing so VERY remarkable in that; nor did Alice think it so VERY much out of the way to hear the Rabbit say to itself, \'Oh dear! Oh dear! I shall be too late!\' (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually TOOK A WATCH OUT OF ITS WAISTCOAT-POCKET, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.\n\nIn another moment down went Alice after it, never once considering how in the world she was to get out again.\n\nThe rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.\n\nEither the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled \'ORANGE MARMALADE\', but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody, so managed to put it into one of the cupboards as she fell past it.\n\n\'Well!\' thought Alice to herself, \'after such a fall as this, I shall think nothing of tumbling down stairs! How brave they\'ll all think me at home! Why, I wouldn\'t say anything about it, even if I fell off the top of the house!\' (Which was very likely true.)\n\nDown, down, down. Would the fall NEVER come to an end! \'I wonder how many miles I\'ve fallen by this time?\' she said aloud. \'I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand miles down, I think-\' (for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, and though this was not a VERY good opportunity for showing off her knowledge, as there was no one to listen to her, still it was good practice to say it over) \'--yes, that\'s about the right distance--but then I wonder what Latitude or Longitude I\'ve got to?\' (Alice had no idea what Latitude was, or Longitude either, but thought they were nice grand words to say.)';
        return new TextEncoder().encode(text);
    }

    generateShakespeareText() {
        const text = 'As You Like It\n\nAct I, Scene I\n\nOrlando. As I remember, Adam, it was upon this fashion bequeathed me by will but poor a thousand crowns, and, as thou sayest, charged my brother, on his blessing, to breed me well: and there begins my sadness. My brother Jaques he keeps at school, and report speaks goldenly of his profit: for my part, he keeps me rustically at home, or, to speak more properly, stays me here at home unkept; for call you that keeping for a gentleman of my birth, that differs not from the stalling of an ox? His horses are bred better; for, besides that they are fair with their feeding, they are taught their manage, and to that end riders dearly hired: but I, his brother, gain nothing under him but growth; for the which his animals on his dunghills are as much bound to him as I. Besides this nothing that he so plentifully gives me, hath something withheld from me, that I shall have more need of than I can make use of. I know he is under the bitterness of passion, and that he is a most unjust man; but better were him a slave than me his brother.\n\nAdam. Yonder comes my master, your brother.\n\nOrlando. Go apart, Adam, and thou shalt hear how he will shake me up.\n\nOliver. Now, sir! what make you here?\n\nOrlando. Nothing: I am not taught to make any thing.\n\nOliver. What mar you then, sir?\n\nOrlando. Marry, sir, I am helping you to mar that which God made, a poor unworthy brother of yours, with idleness.\n\nOliver. Marry, sir, be better employed, and be naught awhile.\n\nOrlando. Shall I keep your hogs and eat husks with them? What prodigal portion have I spent, that I should come to such penury?\n\nOliver. Know you where you are, sir?\n\nOrlando. O, sir, very well: here in your orchard.\n\nOliver. Know you before whom, sir?\n\nOrlando. Ay, better than him I am before knows me. I know you are my eldest brother; and, in the gentle condition of blood, you should so know me. The courtesy of nations allows you my better, in that you are the first-born; but the same tradition takes not away my blood, were there twenty brothers betwixt us: I have as much of my father in me as you; albeit, I confess, your coming before me is nearer to his reverence.\n\nOliver. What, boy!\n\nOrlando. Come, come, elder brother, you are too young in this.\n\nOliver. Wilt thou lay hands on me, villain?\n\nOrlando. I am no villain: I am the youngest son of Sir Rowland de Boys; he was my father, and he is thrice a villain that says such a father begot villains. Wert thou not my brother, I would not take this hand from thy throat till this other had pulled out thy tongue for saying so: thou has railed on thyself.\n\nAdam. Sweet masters, be patient: for your father\'s remembrance, be at accord.\n\nOliver. Let me go, I say.\n\nOrlando. I will not, till I please: you shall hear me. My father charged you in his will to give me good education: you have trained me like a peasant, obscuring and hiding from me all gentleman-like qualities: the spirit of my father grows strong in me, and I will no longer endure it: therefore allow me such exercises as may become a gentleman, or give me the poor allottery my father left me by testament; with that I will go buy my fortunes.\n\nOliver. And what wilt thou do? beg, when that is spent? Well, sir, get you in: I will not long be troubled with you: you shall have some part of your will: I pray you leave me.\n\nOrlando. I will no further offend you than becomes me for my good.\n\nOliver. Get you with him, you old dog.\n\nAdam. Is "old dog" my reward? Most true, I have lost my teeth in your service. God be with my old master! he would not have spoke such a word.\n\n[Exeunt ORLANDO and ADAM]\n\nOliver. Is it even so? begin you to grow upon me? I will physic your rankness, and yet give no thousand crowns neither. Holla, Dennis!';
        return new TextEncoder().encode(text);
    }

    generateLargeHTML() {
        const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Large HTML Document</title>\n    <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }\n        .container { max-width: 1200px; margin: 0 auto; }\n        .header { background-color: #333; color: white; padding: 20px; text-align: center; }\n        .content { display: flex; flex-wrap: wrap; gap: 20px; }\n        .sidebar { flex: 1; min-width: 250px; background-color: #f4f4f4; padding: 20px; }\n        .main { flex: 2; min-width: 300px; }\n        .card { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }\n        .card h3 { margin-top: 0; color: #333; }\n        .footer { background-color: #333; color: white; text-align: center; padding: 20px; margin-top: 20px; }\n    </style>\n</head>\n<body>\n    <div class="header">\n        <h1>Large HTML Document</h1>\n        <p>This is a sample HTML document for compression testing</p>\n    </div>\n    <div class="container">\n        <div class="content">\n            <div class="sidebar">\n                <div class="card">\n                    <h3>Navigation</h3>\n                    <ul>\n                        <li><a href="#section1">Section 1</a></li>\n                        <li><a href="#section2">Section 2</a></li>\n                        <li><a href="#section3">Section 3</a></li>\n                        <li><a href="#section4">Section 4</a></li>\n                        <li><a href="#section5">Section 5</a></li>\n                    </ul>\n                </div>\n                <div class="card">\n                    <h3>Links</h3>\n                    <ul>\n                        <li><a href="https://example.com">Example</a></li>\n                        <li><a href="https://test.com">Test</a></li>\n                        <li><a href="https://demo.com">Demo</a></li>\n                    </ul>\n                </div>\n            </div>\n            <div class="main">\n                <div class="card" id="section1">\n                    <h3>Section 1</h3>\n                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>\n                </div>\n                <div class="card" id="section2">\n                    <h3>Section 2</h3>\n                    <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n                </div>\n                <div class="card" id="section3">\n                    <h3>Section 3</h3>\n                    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>\n                </div>\n                <div class="card" id="section4">\n                    <h3>Section 4</h3>\n                    <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>\n                </div>\n                <div class="card" id="section5">\n                    <h3>Section 5</h3>\n                    <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</p>\n                </div>\n            </div>\n        </div>\n    </div>\n    <div class="footer">\n        <p>&copy; 2024 Large HTML Document. All rights reserved.</p>\n    </div>\n</body>\n</html>';
        return new TextEncoder().encode(html);
    }

    generateCSourceCode() {
        const code = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define MAX_SIZE 1024\n\ntypedef struct {\n    int id;\n    char name[50];\n    float value;\n} Item;\n\nItem* create_item(int id, const char* name, float value) {\n    Item* item = (Item*)malloc(sizeof(Item));\n    if (item == NULL) {\n        return NULL;\n    }\n    item->id = id;\n    strncpy(item->name, name, sizeof(item->name) - 1);\n    item->name[sizeof(item->name) - 1] = '\\0';\n    item->value = value;\n    return item;\n}\n\nvoid print_item(const Item* item) {\n    if (item == NULL) {\n        printf("Item is NULL\\n");\n        return;\n    }\n    printf("ID: %d, Name: %s, Value: %.2f\\n", item->id, item->name, item->value);\n}\n\nint main() {\n    Item* items[MAX_SIZE];\n    int count = 0;\n    \n    // Create some items\n    for (int i = 0; i < 5; i++) {\n        char name[50];\n        sprintf(name, "Item %d", i);\n        items[count++] = create_item(i, name, i * 1.5f);\n    }\n    \n    // Print all items\n    for (int i = 0; i < count; i++) {\n        print_item(items[i]);\n    }\n    \n    // Free memory\n    for (int i = 0; i < count; i++) {\n        free(items[i]);\n    }\n    \n    return 0;\n}`;
        return new TextEncoder().encode(code);
    }

    generateLispCode() {
        const code = `(defun factorial (n)\n  "Calculate the factorial of n"\n  (if (<= n 1)\n      1\n      (* n (factorial (- n 1)))))\n\n(defun fibonacci (n)\n  "Calculate the nth Fibonacci number"\n  (cond ((= n 0) 0)\n        ((= n 1) 1)\n        (t (+ (fibonacci (- n 1)) (fibonacci (- n 2))))))\n\n(defun mapcar (func list)\n  "Apply function to each element of list"\n  (if (null list)\n      nil\n      (cons (func (car list)) (mapcar func (cdr list)))))\n\n(defun filter (pred list)\n  "Filter list based on predicate"\n  (cond ((null list) nil)\n        ((funcall pred (car list)) (cons (car list) (filter pred (cdr list))))\n        (t (filter pred (cdr list)))))\n\n(defun reduce (func list &optional initial)\n  "Reduce list using function"\n  (if (null list)\n      initial\n      (if initial\n          (reduce func (cdr list) (funcall func initial (car list)))\n          (reduce func (cdr list) (car list)))))\n\n(defun quicksort (list)\n  "Sort list using quicksort algorithm"\n  (if (null list)\n      nil\n      (let ((pivot (car list))\n            (rest (cdr list)))\n        (append (quicksort (filter (lambda (x) (< x pivot)) rest))\n                (list pivot)\n                (quicksort (filter (lambda (x) (>= x pivot)) rest))))))`;
        return new TextEncoder().encode(code);
    }

    generateExcelData(size) {
        const data = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    generateTechnicalWriting() {
        const text = 'Technical writing is the process of researching and writing about specialized topics in a way that is clear to the intended audience. Technical writers work in many fields, such as engineering, medicine, computer science, and consumer electronics. Their goal is to make complex information easy to understand and use.\n\nThe field of technical writing has evolved significantly with the advent of digital technology. Technical writers now create content for a variety of platforms, including websites, mobile applications, and software documentation. They must be skilled in both writing and technical subjects, and they often work closely with subject matter experts to ensure accuracy.\n\nGood technical writing is characterized by clarity, conciseness, and completeness. It should be written in a style that is appropriate for the intended audience, and it should be free of errors and ambiguities. Technical writers use a variety of tools and techniques to create their documents, including word processors, graphics software, and content management systems.\n\nThe process of technical writing typically involves several steps: planning, researching, drafting, reviewing, and revising. Technical writers must be able to work independently and as part of a team, and they must be able to meet deadlines and adapt to changing requirements.\n\nTechnical writing is an important field that helps people understand and use complex products and services. It requires a unique combination of writing skills, technical knowledge, and attention to detail. As technology continues to evolve, the demand for skilled technical writers is likely to grow.';
        return new TextEncoder().encode(text);
    }

    generateParadiseLost() {
        const text = 'Of Man\'s first disobedience, and the fruit\nOf that forbidden tree whose mortal taste\nBrought death into the World, and all our woe,\nWith loss of Eden, till one greater Man\nRestore us, and regain the blissful seat,\nSing, Heavenly Muse, that, on the secret top\nOf Oreb, or of Sinai, didst inspire\nThat shepherd who first taught the chosen seed\nIn the beginning how the heavens and earth\nRose out of Chaos: or, if Sion hill\nDelight thee more, and Siloa\'s brook that flowed\nFast by the oracle of God, I thence\nInvoke thy aid to my adventurous song,\nThat with no middle flight intends to soar\nAbove the Aonian mount, while it pursues\nThings unattempted yet in prose or rhyme.\n\nAnd chiefly thou, O Spirit, that dost prefer\nBefore all temples the upright heart and pure,\nInstruct me, for thou knowest; thou from the first\nWast present, and, with mighty wings outspread,\nDovelike sat\'st brooding on the vast Abyss,\nAnd mad\'st it pregnant: what in me is dark\nIllumine, what is low raise and support;\nThat, to the height of this great argument,\nI may assert Eternal Providence,\nAnd justify the ways of God to men.';
        return new TextEncoder().encode(text);
    }

    generateTerminalData(size) {
        const data = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    generateManPage() {
        const text = 'XARGS(1)                 BSD General Commands Manual                XARGS(1)\n\nNAME\n     xargs -- construct argument list(s) and execute utility\n\nSYNOPSIS\n     xargs [-0oprt] [-E eofstr] [-I replstr] [-J replstr] [-L number] [-n number]\n            [-P maxprocs] [-R replacements] [-S replsize] [-s size]\n            [-x] [utility [argument ...]]\n\nDESCRIPTION\n     The xargs utility reads space, tab, newline and end-of-file delimited strings\n     from the standard input and executes utility with the strings as arguments.\n\n     Any arguments specified on the command line are given to utility upon each\n     invocation, followed by any number of additional arguments read from the\n     standard input.\n\n     The options are as follows:\n\n     -0      Change xargs to expect NUL (\'\\0\') characters as separators, instead\n             of spaces and newlines.  This is expected to be used in conjunc-\n             tion with the -print0 function in find(1).\n\n     -E eofstr\n             Specify a string, which, when encountered, will cause xargs to stop\n             reading input.  The default is the underscore character (\'_\').\n\n     -I replstr\n             Execute utility for each input line, replacing one or more occur-\n             rences of replstr in up to replacements (or 5 if no -R flag is\n             specified) arguments to utility with the entire line of input.\n\n     -J replstr\n             If this option is specified, xargs uses the replstr to replace\n             the first occurrence of replstr instead of appending all arguments\n             after the last argument.\n\n     -L number\n             Call utility for every number of non-empty lines read.  A line ending\n             with unescaped white space is considered to end when it reads a newline\n             character or the EOF.\n\n     -n number\n             Set the maximum number of arguments taken from standard input for\n             each invocation of utility.  An invocation of utility will use less\n             than number standard input arguments if the number of bytes accumulated\n             exceeds size or there are fewer than number arguments remaining for\n             the last invocation.\n\n     -o      Reopen stdin as /dev/tty in the child process before executing the\n             command.  This is useful if you want xargs to run an interactive\n             application.\n\n     -P maxprocs\n             Parallel mode: run up to maxprocs utility processes at a time.\n\n     -p      Echo each command to be executed and ask the user whether it should\n             be executed.  An affirmative response, `y\' in the POSIX locale,\n             causes the command to be executed, any other response causes it to be\n             skipped.  No commands are executed if the process is not attached to\n             a terminal.';
        return new TextEncoder().encode(text);
    }

    generateBibliography() {
        const text = '@article{knuth1984,\n  title={Literate programming},\n  author={Knuth, Donald E},\n  journal={The Computer Journal},\n  volume={27},\n  number={2},\n  pages={97--111},\n  year={1984},\n  publisher={Oxford University Press}\n}\n\n@book{cormen2009,\n  title={Introduction to algorithms},\n  author={Cormen, Thomas H and Leiserson, Charles E and Rivest, Ronald L and Stein, Clifford},\n  year={2009},\n  publisher={MIT press}\n}\n\n@inproceedings{shannon1948,\n  title={A mathematical theory of communication},\n  author={Shannon, Claude E},\n  booktitle={The Bell system technical journal},\n  volume={27},\n  number={3},\n  pages={379--423},\n  year={1948}\n}';
        return new TextEncoder().encode(text);
    }

    generateBookText() {
        const text = 'Chapter 1\n\nThe morning sun streamed through the window, casting long shadows across the room. Sarah sat at her desk, staring at the blank page before her. She had been trying to write for hours, but the words just wouldn\'t come.\n\nShe sighed and leaned back in her chair, rubbing her temples. Writer\'s block again. It seemed like it was always the same story - she would start with great enthusiasm, only to hit a wall a few chapters in.\n\nMaybe she needed a break. She stood up and walked to the window, looking out at the street below. People were going about their daily lives, oblivious to her struggle. A woman walked by with a stroller, a man in a business suit hurried past, and a group of teenagers laughed as they made their way down the sidewalk.\n\nSarah watched them for a moment, feeling a pang of envy. They all seemed so purposeful, so sure of where they were going. Meanwhile, she was stuck in her apartment, unable to write a single coherent sentence.\n\nShe turned away from the window and walked to the kitchen. Maybe some coffee would help. She filled the kettle and put it on the stove, watching the blue flame lick the bottom.\n\nWhile she waited for the water to boil, she thought about her story. It was about a young woman who discovers she has the ability to see into the future. It was a concept that had excited her at first, but now it seemed cliché and overdone.\n\nPerhaps she should try a different approach. Maybe the story wasn\'t about the ability itself, but about how it affected the character\'s relationships. That could be more interesting.\n\nThe kettle whistled, interrupting her thoughts. She poured the hot water over the coffee grounds and inhaled the rich aroma. Maybe this was exactly what she needed - a fresh perspective and a good cup of coffee.';
        return new TextEncoder().encode(text);
    }

    generateSeismicData() {
        const data = new Uint8Array(1024);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    generateNewsText() {
        const text = 'Breaking News: Scientists Discover New Species in Amazon Rainforest\n\nResearchers from the University of Cambridge announced today the discovery of a previously unknown species of primate in the remote regions of the Amazon rainforest.\n\nThe new species, tentatively named "Ateles cambridgei," belongs to the spider monkey family and is distinguished by its unique vocalizations and distinctive facial markings.\n\n"This is an incredibly exciting discovery," said Dr. Maria Rodriguez, lead researcher on the project. "Not only does it add to our understanding of primate diversity, but it also highlights the importance of preserving these fragile ecosystems."\n\nThe discovery was made during a three-year expedition to the region, during which the team documented over 200 species previously unknown to science.\n\nConservation groups have hailed the discovery as evidence of the rich biodiversity that remains to be discovered in the world\'s rainforests, and have called for increased protection of these areas.\n\nHowever, the researchers also noted that the species\' habitat is under threat from deforestation and climate change, and immediate action is needed to ensure its survival.';
        return new TextEncoder().encode(text);
    }

    generateObjectCode() {
        const data = new Uint8Array(1024);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    generateResearchPaper() {
        const text = 'Abstract\n\nThis paper presents a novel approach to data compression using adaptive dictionary-based encoding. Our method achieves compression ratios comparable to established algorithms while maintaining fast compression and decompression speeds.\n\nIntroduction\n\nData compression is a fundamental problem in computer science with applications ranging from file storage to network transmission. Traditional approaches include dictionary-based methods like LZ77 and statistical methods like Huffman coding. Our approach combines the strengths of both techniques.\n\nMethodology\n\nWe propose an adaptive dictionary that dynamically updates based on the characteristics of the input data. The dictionary is built using a sliding window approach, with frequent substrings being added to the dictionary for efficient encoding.\n\nResults\n\nOur experiments on standard benchmark corpora show that our method achieves an average compression ratio of 2.3:1, with compression speeds of up to 50 MB/s and decompression speeds of up to 100 MB/s.\n\nConclusion\n\nThe proposed method offers a promising alternative to existing compression algorithms, particularly for applications where both compression ratio and speed are important.\n\nReferences\n\n[1] Ziv, J., & Lempel, A. (1977). A universal algorithm for sequential data compression. IEEE Transactions on Information Theory, 23(3), 337-343.\n\n[2] Huffman, D. A. (1952). A method for the construction of minimum-redundancy codes. Proceedings of the IRE, 40(9), 1098-1101.';
        return new TextEncoder().encode(text);
    }

    generatePictureData() {
        const data = new Uint8Array(1024);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    generatePascalCode() {
        const code = `program HelloWorld;\n\nuses\n  SysUtils;\n\ntype\n  TPerson = record\n    Name: string;\n    Age: Integer;\n  end;\n\nfunction CreatePerson(const AName: string; AAge: Integer): TPerson;\nbegin\n  Result.Name := AName;\n  Result.Age := AAge;\nend;\n\nprocedure PrintPerson(const APerson: TPerson);\nbegin\n  WriteLn('Name: ', APerson.Name);\n  WriteLn('Age: ', APerson.Age);\nend;\n\nvar\n  People: array[1..5] of TPerson;\n  I: Integer;\n\nbegin\n  for I := 1 to 5 do\n  begin\n    People[I] := CreatePerson('Person ' + IntToStr(I), I * 10);\n    PrintPerson(People[I]);\n  end;\nend.`;
        return new TextEncoder().encode(code);
    }

    generateTranscript() {
        const text = 'Transcript of Meeting\n\nDate: January 15, 2024\nTime: 10:00 AM - 11:30 AM\nAttendees: John Smith, Jane Doe, Michael Johnson\n\nJohn: Good morning, everyone. Thank you for joining today\'s meeting. The purpose of this meeting is to discuss the upcoming product launch.\n\nJane: Thanks, John. I\'d like to start by reviewing the timeline. We\'re currently on track for a March 1st launch, but there are a few dependencies we need to address.\n\nMichael: Could you elaborate on those dependencies?\n\nJane: Certainly. First, we need to complete the user acceptance testing by February 15th. Second, the marketing materials need to be finalized by February 20th. And third, we need to ensure all regulatory approvals are in place by February 25th.\n\nJohn: That sounds manageable. What are the current statuses of these items?\n\nJane: UAT is 60% complete. Marketing materials are in the design phase. Regulatory approvals are pending final review.\n\nMichael: I can help with the UAT. My team has some capacity next week.\n\nJane: That would be great, Michael. Thank you.\n\nJohn: Excellent. Let\'s schedule a follow-up meeting for next Thursday to review progress. Any other items to discuss?\n\nJane: No, I think that covers it for today.\n\nMichael: Same here.\n\nJohn: Great. Meeting adjourned.';
        return new TextEncoder().encode(text);
    }

    /**
     * Run industry-standard benchmarks
     */
    async runIndustryBenchmarks() {
        // Clear previous results
        this.results = [];
        
        console.log('[Brotli2 Industry Benchmark] Starting industry-standard tests...\n');

        // Test Silesia Corpus
        console.log('=== Silesia Corpus ===');
        const silesiaSamples = this.generateSilesiaCorpus();
        for (const [name, data] of Object.entries(silesiaSamples)) {
            await this.benchmarkSample('Silesia', name, data);
        }

        // Test Canterbury Corpus
        console.log('\n=== Canterbury Corpus ===');
        const canterburySamples = this.generateCanterburyCorpus();
        for (const [name, data] of Object.entries(canterburySamples)) {
            await this.benchmarkSample('Canterbury', name, data);
        }

        // Test Calgary Corpus
        console.log('\n=== Calgary Corpus ===');
        const calgarySamples = this.generateCalgaryCorpus();
        for (const [name, data] of Object.entries(calgarySamples)) {
            await this.benchmarkSample('Calgary', name, data);
        }

        // Print results
        this.printIndustryResults();
    }

    /**
     * Benchmark a single sample
     */
    async benchmarkSample(corpus, name, data) {
        if (!window.Brotli2) {
            console.error('[Brotli2 Industry Benchmark] Brotli2 not loaded');
            return;
        }

        const compressor = new window.Brotli2();
        
        // Compress
        const compStart = performance.now();
        const compressed = compressor.compress(data);
        const compTime = performance.now() - compStart;
        
        // Decompress
        const decompStart = performance.now();
        const decompressed = compressor.decompress(compressed);
        const decompTime = performance.now() - decompStart;
        
        // Verify
        const verified = this.arraysEqual(data, decompressed);
        
        const result = {
            corpus,
            name,
            originalSize: data.length,
            compressedSize: compressed.length,
            compressionRatio: data.length / compressed.length,
            compressionTime: compTime,
            decompressionTime: decompTime,
            verified
        };
        
        this.results.push(result);
        
        console.log(`${name.padEnd(20)} | ${data.length.toString().padEnd(8)} | ${compressed.length.toString().padEnd(8)} | ${result.compressionRatio.toFixed(2).padEnd(6)}x | ${compTime.toFixed(2).padEnd(8)}ms | ${decompTime.toFixed(2).padEnd(8)}ms | ${verified ? '✓' : '✗'}`);
    }

    /**
     * Compare two arrays
     */
    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Print industry benchmark results
     */
    printIndustryResults() {
        console.log('\n=== Industry Benchmark Results ===');
        console.log('Corpus | File Name | Original | Compressed | Ratio | Comp Time | Decomp Time | Verified');
        console.log('--------|-----------|----------|------------|-------|-----------|-------------|----------');

        for (const result of this.results) {
            const { corpus, name, originalSize, compressedSize, compressionRatio, compressionTime, decompressionTime, verified } = result;
            console.log(`${corpus.padEnd(7)} | ${name.padEnd(9)} | ${originalSize.toString().padEnd(8)} | ${compressedSize.toString().padEnd(8)} | ${compressionRatio.toFixed(2).padEnd(5)}x | ${compressionTime.toFixed(2).padEnd(9)}ms | ${decompressionTime.toFixed(2).padEnd(11)}ms | ${verified ? '✓' : '✗'}`);
        }

        // Calculate averages by corpus
        const corpusStats = {};
        for (const result of this.results) {
            if (!corpusStats[result.corpus]) {
                corpusStats[result.corpus] = { totalRatio: 0, totalCompTime: 0, totalDecompTime: 0, count: 0 };
            }
            corpusStats[result.corpus].totalRatio += result.compressionRatio;
            corpusStats[result.corpus].totalCompTime += result.compressionTime;
            corpusStats[result.corpus].totalDecompTime += result.decompressionTime;
            corpusStats[result.corpus].count++;
        }

        console.log('\n=== Summary by Corpus ===');
        for (const [corpus, stats] of Object.entries(corpusStats)) {
            const avgRatio = stats.totalRatio / stats.count;
            const avgCompTime = stats.totalCompTime / stats.count;
            const avgDecompTime = stats.totalDecompTime / stats.count;
            console.log(`${corpus}: ${stats.count} files, Avg Ratio: ${avgRatio.toFixed(2)}x, Avg Comp Time: ${avgCompTime.toFixed(2)}ms, Avg Decomp Time: ${avgDecompTime.toFixed(2)}ms`);
        }
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.brotli2IndustryBenchmark = new Brotli2IndustryBenchmark();
        console.log('[Brotli2 Industry Benchmark] Initialized');
    });
}
