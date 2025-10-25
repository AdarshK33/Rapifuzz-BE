// models/comment.js
const sql = require("./db");
const axios = require("axios");

const Story = function (story) {
  this.userid = story.userid;
};

/**
 * Get stories for a user with pagination and search.
 * @param {number} id - User ID
 * @param {string} host - Host URL for DB images
 * @param {object} options - { page, limit, search }
 */


let cachedApiStories = [];
let lastApiFetch = 0;

Story.getStoryById = (id, host, options = {}) => {
  const { page = 1, limit = 10, search = "" } = options;

  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;

    let sqlQuery = `SELECT * FROM stories WHERE userid = ?`;
    const sqlParams = [id];

    if (search) {
      sqlQuery += ` AND img LIKE ?`;
      sqlParams.push(`%${search}%`);
    }

    let countQuery = `SELECT COUNT(*) AS total FROM stories WHERE userid = ?`;
    const countParams = [id];
    if (search) {
      countQuery += ` AND img LIKE ?`;
      countParams.push(`%${search}%`);
    }

    sql.query(countQuery, countParams, async (countErr, countRes) => {
      if (countErr) return reject(countErr);

      const dbTotal = countRes[0].total;

      sqlQuery += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
      sqlParams.push(limit, offset);

      sql.query(sqlQuery, sqlParams, async (err, res) => {
        if (err) return reject(err);

        const dbStories = res.map(user => ({
          id: user.id,
          userid: user.userid,
          img: user.img ? encodeURI(host + user.img) : "",
          title: user.title || ""
        }));

        try {
          // 🕒 Use cache (refresh every 10 minutes)
          const now = Date.now();
          if (!cachedApiStories.length || now - lastApiFetch > 10 * 60 * 1000) {
            const apiResponse = await axios.get("https://jsonplaceholder.typicode.com/photos");
            cachedApiStories = apiResponse.data;
            lastApiFetch = now;
            console.log("✅ Cached API stories:", cachedApiStories.length);
          }

          // 🔍 Filter API data if needed
          let apiStories = cachedApiStories;
          if (search) {
            apiStories = apiStories.filter(item =>
              item.title.toLowerCase().includes(search.toLowerCase())
            );
          }

          const apiTotal = apiStories.length;

          // 🧩 Paginate only API data for current page
          const apiStart = (page - 1) * limit;
          const apiEnd = apiStart + limit;
          const apiPageData = apiStories.slice(apiStart, apiEnd).map(item => ({
            id: item.id,
            userid: id,
            img: item.url,
            title: item.title
          }));

          const stories = [...dbStories, ...apiPageData];

          resolve({ stories, total: dbTotal + apiTotal });
        } catch (apiErr) {
          console.error("⚠️ API fetch failed:", apiErr.message);
          resolve({ stories: dbStories, total: dbTotal });
        }
      });
    });
  });
};



Story.create = (file_path, userid) => {
  return new Promise((resolve, reject) => {
    const insertQuery = "INSERT INTO stories (img, userid) VALUES (?, ?)";
    sql.query(insertQuery, [file_path, userid], (err, insertRes) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(insertRes);
    });
  });
};

module.exports = Story;
