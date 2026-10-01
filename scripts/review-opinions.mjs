// Operator-only tool. Requires an existing DATABASE_URL; never prints account identifiers.
import pg from 'pg';
const [action,id,version]=process.argv.slice(2);
if(!['list','feedback','approve','reject','reviewed'].includes(action)) throw Error('Use: list | feedback | approve <id> <revision> | reject <id> <revision> | reviewed <id> <revision>');
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL required');
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
try {
 await db.connect();
 if(action==='list'||action==='feedback') {
  const result=await db.query(`SELECT id,revision,kind,company_name,category,rating,body,status,updated_at FROM truckpay_opinions WHERE kind=$1 AND status=$2 ORDER BY updated_at LIMIT 100`,[action==='list'?'company':'platform',action==='list'?'pending':'received']);
  console.log(JSON.stringify(result.rows,null,2));
 }else{
  if(!id||!version||!/^[0-9a-f-]{36}$/i.test(version))throw Error('Provide id and exact revision returned by list/feedback.');
  const result=await db.query(`UPDATE truckpay_opinions SET status=$3 WHERE id=$1 AND revision=$2::uuid AND kind=$4 AND status=$5 RETURNING id,status`,[id,version,action==='approve'?'approved':action==='reject'?'rejected':'reviewed',action==='reviewed'?'platform':'company',action==='reviewed'?'received':'pending']);
  if(!result.rows.length)throw Error('No change: entry was edited, deleted, already reviewed, or has the wrong type. Reload first.');
  console.log(JSON.stringify(result.rows[0]));
 }
}finally{await db.end();}
