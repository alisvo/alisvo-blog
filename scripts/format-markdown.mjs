import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogDir = path.resolve(__dirname, '../src/content/blog');

// 1. Resolve Duplicates
const duplicatesToResolve = [
  {
    keep: 'a-simple-script-for-starting-non-rac-oracle-databases-with-a-dg-configuration.md',
    takeFrom: 'a-simple-script-for-starting-non-rac-oracle-databases-with-a-dg-configurati.md',
    deleteOld: ['a-simple-script-for-starting-non-rac-oracle-databases-with-a-dg-configurati.md']
  },
  {
    keep: 'creating-jobs-with-different-users-via-pgcron-in-azure-postgresql-flexible-server.md',
    takeFrom: 'creating-jobs-with-different-users-via-pgcron-in-azure-postgresql-flexible-.md',
    deleteOld: [
      'creating-jobs-with-different-users-via-pgcron-in-azure-postgresql-flexible-.md',
      'creating-jobs-with-different-users-via-pgcron-in-azure-postgresql-flexible-serve.md'
    ]
  },
  {
    keep: 'sysaux-tablespace-filling-cause-wriadvtasks-filled-with-autostatsadvisortask.md',
    takeFrom: 'sysaux-tablespace-filling-cause-wriadvtasks-filled-with-autostatsadvisortas.md',
    deleteOld: ['sysaux-tablespace-filling-cause-wriadvtasks-filled-with-autostatsadvisortas.md']
  },
  {
    keep: 'upgrading-password-encryption-from-md5-to-scram-sha-256-in-a-postgresql-database.md',
    takeFrom: null,
    deleteOld: ['upgrading-password-encryption-from-md5-to-scram-sha-256-in-a-postgresql-dat.md']
  },
  {
    keep: 'warn-yourself-when-your-linux-server-isnt-restarted-for-a-while-after-an-update.md',
    takeFrom: 'warn-yourself-when-your-linux-server-isnt-restarted-for-a-while-after-an-up.md',
    deleteOld: [
      'warn-yourself-when-your-linux-server-isnt-restarted-for-a-while-after-an-up.md',
      'warn-yourself-when-your-linux-server-isnt-restarted-for-a-while-after-an-update-.md'
    ]
  }
];

duplicatesToResolve.forEach(d => {
  if (d.takeFrom) {
    const srcPath = path.join(blogDir, d.takeFrom);
    const destPath = path.join(blogDir, d.keep);
    if (fs.existsSync(srcPath)) {
      const content = fs.readFileSync(srcPath, 'utf-8');
      fs.writeFileSync(destPath, content, 'utf-8');
      console.log(`[Duplicate] Copied best content to ${d.keep}`);
    }
  }
  d.deleteOld.forEach(oldFile => {
    const p = path.join(blogDir, oldFile);
    if (fs.existsSync(p) && oldFile !== d.keep) {
      fs.unlinkSync(p);
      console.log(`[Duplicate] Deleted redundant file ${oldFile}`);
    }
  });
});

// 2. Fix how-to-move-datafiles-in-oragle-11gr2.md
const oldOragleFile = path.join(blogDir, 'how-to-move-datafiles-in-oragle-11gr2.md');
const newOracleFile = path.join(blogDir, 'how-to-move-datafiles-in-oracle-11gr2.md');
if (fs.existsSync(oldOragleFile)) {
  let content = fs.readFileSync(oldOragleFile, 'utf-8');
  content = content.replace('title: "How To Move Datafiles  In Oragle 11gR2"', 'title: "How To Move Datafiles In Oracle 11gR2"');
  content = content.replace('# How to Move (Rename) an Oracle Datafile to a New Folder in Oracle 11g', '# How to Move (Rename) an Oracle Datafile to a New Folder in Oracle 11g');
  content = content.replace('```text\n___CODE_BLOCK_0___\n```', '```sql\nSELECT file_name, tablespace_name, bytes/1024/1024 AS size_mb \nFROM dba_data_files;\n```');
  content = content.replace('```text\n___CODE_BLOCK_1___\n```', '```sql\nALTER TABLESPACE <tablespace_name> OFFLINE;\n```');
  content = content.replace('```text\n___CODE_BLOCK_2___\n```', '```sql\nSHUTDOWN IMMEDIATE;\nSTARTUP MOUNT;\n```');
  content = content.replace('```text\n___CODE_BLOCK_3___\n```', '```bash\nmv /old/path/datafile01.dbf /new/path/datafile01.dbf\n```');
  content = content.replace('```text\n___CODE_BLOCK_4___\n```', '```sql\nALTER DATABASE RENAME FILE \'/old/path/datafile01.dbf\' \nTO \'/new/path/datafile01.dbf\';\n```');
  content = content.replace('```text\n___CODE_BLOCK_5___\n```', '```sql\nALTER TABLESPACE <tablespace_name> ONLINE;\n```');
  content = content.replace('```text\n___CODE_BLOCK_6___\n```', '```sql\nALTER DATABASE OPEN;\n```');
  content = content.replace('```text\n___CODE_BLOCK_7___\n```', '```sql\nSELECT file_name, status, tablespace_name \nFROM dba_data_files;\n```');
  fs.writeFileSync(newOracleFile, content, 'utf-8');
  fs.unlinkSync(oldOragleFile);
  console.log('[Fix] Reconstructed code blocks and renamed how-to-move-datafiles-in-oracle-11gr2.md');
}

// 3. Custom description fixes for files with ___CODE_BLOCK_ in frontmatter
const descriptionFixes = {
  'adjusting-sga-pga-in-oracle-databases.md': 'Oracle veritabanlarında memory_target, SGA ve PGA bellek parametrelerinin incelenmesi ve dinamik olarak ayarlanması adımları.',
  'creating-a-script-that-fixes-unusable-indexes.md': 'Oracle veritabanında UNUSABLE durumdaki indeksleri tespit eden ve otomatik olarak REBUILD eden pratik SQL scripti.',
  'how-to-createexecutedrop-tuning-tasks.md': 'Oracle SQL Tuning Advisor (STA) ile sorgu optimizasyon görevleri oluşturma, çalıştırma ve silme adımları.',
  'how-to-move-datafiles-in-oracle-11gr2.md': 'Oracle 11gR2 üzerinde kullanıcı veya sistem veri kütüklerini (datafiles) kontrol dosyası ile senkron şekilde yeni bir dizine taşıma rehberi.',
  'oracle-19c-failover-steps.md': 'Oracle 19c Data Guard ortamlarında felaket anında standby veritabanını primary moda geçirme (Failover) operasyon adımları.',
  'oracle-database-19c-switchover-steps.md': 'Oracle 19c Data Guard mimarisinde planlı bakım ve veri merkezi geçişleri için sıfır veri kayıplı Switchover rehberi.',
  'postgresql-change-data-directory-in-the-service.md': 'Systemd ile yönetilen PostgreSQL servislerinde veri dizinini (data directory) güvenli bir şekilde farklı bir diske veya dizine taşıma.',
  'postgresql-maintenance-cheat-sheet.md': "PostgreSQL DBA'leri için VACUUM, ANALYZE, REINDEX ve tablo şişmesi (bloat) yönetimini içeren hızlı başvuru rehberi.",
  'some-postgresql-backup-commands-reference.md': 'PostgreSQL pg_dump, pg_dumpall ve pg_restore komutları ile şema, tablo ve veri yedekleme pratik komut referansı.'
};

function detectLanguage(code) {
  const trimmed = code.trim();
  const upper = trimmed.toUpperCase();

  // SQL detection
  const sqlKeywords = [
    'SELECT ', 'INSERT ', 'UPDATE ', 'DELETE ', 'CREATE ', 'ALTER ', 'DROP ',
    'TRUNCATE ', 'GRANT ', 'REVOKE ', 'SHOW PARAMETER', 'EXPLAIN ', 'SET PAGES',
    'SET LINES', 'COL ', 'DECLARE', 'BEGIN\n', 'BEGIN ', 'COMMIT;', 'ROLLBACK;',
    'FROM ', 'WHERE ', 'JOIN ', 'GROUP BY', 'ORDER BY', 'TABLESPACE', 'SHUTDOWN IMMEDIATE',
    'STARTUP', 'ALTER SYSTEM', 'ALTER DATABASE', 'ALTER TABLE', 'EXEC DBMS_'
  ];
  let sqlScore = 0;
  for (const kw of sqlKeywords) {
    if (upper.includes(kw)) sqlScore++;
  }
  if (sqlScore >= 1) return 'sql';

  // Bash detection
  const bashKeywords = [
    'sudo ', 'systemctl ', 'pg_dump ', 'pg_restore ', 'pg_dumpall', 'rman ',
    'lsnrctl ', 'export ', 'tar -', 'chmod ', 'chown ', 'psql ', 'cat <<',
    'grep ', 'tail ', 'mkdir ', 'cp ', 'mv ', 'rm -', 'dgmgrl ', 'opatch ',
    'sqlcmd ', 'pgbackrest ', 'pigz ', 'crontab ', 'journalctl', '#!/bin/bash',
    'apt-get ', 'dnf ', 'yum ', 'touch ', 'echo '
  ];
  let bashScore = 0;
  for (const kw of bashKeywords) {
    if (trimmed.includes(kw)) bashScore++;
  }
  if (bashScore >= 1) return 'bash';

  // Python detection
  if (trimmed.includes('def ') || trimmed.includes('import ') || trimmed.includes('print(')) {
    return 'python';
  }

  // INI / Conf
  if (/^\[[a-z0-9_.-]+\]/im.test(trimmed) || /^[a-z0-9_.]+\s*=\s*.+/im.test(trimmed)) {
    return 'ini';
  }

  return 'text';
}

// 4. Process all Markdown files
const allFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

allFiles.forEach(file => {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Split frontmatter and body
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return;

  let fm = fmMatch[1];
  let body = content.slice(fmMatch[0].length);

  // Apply description fix if present
  if (descriptionFixes[file]) {
    fm = fm.replace(/description:\s*"?(.*?)"?\r?$/m, `description: "${descriptionFixes[file]}"`);
  }

  // Ensure title has no extra spaces
  fm = fm.replace(/title:\s*"(.*?)"/g, (m, t) => `title: "${t.replace(/\s+/g, ' ').trim()}"`);

  // Unescape numbers in headings: ## 1\. -> ## 1.
  body = body.replace(/^(#{1,6}\s+)(\d+)\\\.\s*/gm, '$1$2. ');

  // Unescape numbered list items: 1\. -> 1.
  body = body.replace(/^(\s*)(\d+)\\\.\s*/gm, '$1$2. ');

  // Unescape dashes: \- -> -
  body = body.replace(/^(\s*)\\-\s*/gm, '$1- ');

  // Process code blocks
  // Regex to match code fences: ```lang?\n code \n```
  body = body.replace(/```([a-z0-9_-]*)\r?\n([\s\S]*?)```/gi, (match, lang, code) => {
    let cleanCode = code.trim();
    let effectiveLang = lang.trim().toLowerCase();

    // If no language specified or language is text, try to detect SQL or Bash
    if (!effectiveLang || effectiveLang === 'text') {
      const detected = detectLanguage(cleanCode);
      if (detected !== 'text' || !effectiveLang) {
        effectiveLang = detected;
      }
    }

    return `\`\`\`${effectiveLang}\n${cleanCode}\n\`\`\``;
  });

  // Clean trailing spaces on every line
  const cleanedLines = body.split(/\r?\n/).map(line => line.trimEnd());
  body = cleanedLines.join('\n');

  // Replace 3 or more consecutive empty lines with 2 empty lines
  body = body.replace(/\n{3,}/g, '\n\n');

  // Ensure clean spacing around headings
  body = body.replace(/\n(#{1,6}\s+[^\n]+)/g, '\n\n$1');
  body = body.replace(/\n{3,}/g, '\n\n');

  // Final reconstructed content
  const finalContent = `---\n${fm.trim()}\n---\n\n${body.trim()}\n`;
  fs.writeFileSync(filePath, finalContent, 'utf-8');
  console.log(`[Cleaned] ${file}`);
});

console.log(`\nSuccessfully formatted all ${allFiles.length} markdown articles!`);
