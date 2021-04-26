const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res
}

const createNewTask = async (userid, username, todotask) => {
  const task = await pool.query('INSERT INTO nlp_todo_bot.todo(userid, username,todotask) VALUES ($1, $2, $3) RETURNING *', [userid, username, todotask]);
  console.log('created new task ', task.rows[0]);
  return `Saved new task: ${task.rows[0].todotask} with id: ${task.rows[0].taskid}`
}

const getAllUserTasks = async (userid) => {
  const todos = await pool.query('SELECT t.taskid, t.todotask FROM nlp_todo_bot.todo AS t WHERE t.userid = $1', [userid]);
  let tasks = '';

  todos.rows.forEach(task => {
    let str = `id: ${task.taskid} task: ${task.todotask} `
    tasks = tasks.concat('\n ', str);
  });

  return tasks;
}

module.exports = {
  query,
  createNewTask,
  getAllUserTasks
}