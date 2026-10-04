// Weighted ("Bayesian average") ranking score.
//   score = (v / (v + m)) * R + (m / (v + m)) * C
//   v = number of ratings for the store, R = its average rating,
//   C = average of all ratings on the platform, m = votes needed before a store's own average dominates.
// A store with a single 5-star rating therefore scores below a store with 200 ratings averaging 4.7.
const M = Number(process.env.RANKING_MIN_VOTES) || 5;

const SCORE_SQL = `ROUND((COUNT(r.id) / (COUNT(r.id) + ${M})) * IFNULL(AVG(r.rating), 0) + (${M} / (COUNT(r.id) + ${M})) * g.c, 2)`;
const GLOBAL_JOIN = 'CROSS JOIN (SELECT IFNULL(AVG(rating), 3) AS c FROM ratings) g';

module.exports = { SCORE_SQL, GLOBAL_JOIN };
