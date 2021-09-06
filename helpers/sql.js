const { BadRequestError } = require("../expressError");

/** The sqlForPartialUpdate function is called to make partial updates to the database.
 * 
 * dataToUpdate: the new data for the company/user that we want
 * jsToSql: a starter JS object with the column names converted from JS format to SQL
 * 
 * The keys are extracted from dataToUpdate to create a custom SET statement.
 * 
 * For example, if the input data is...
 * {firstName: 'Aliya', age: 32}
 * the output is...
 * ['"first_name"=$1', '"age"=$2']
 * 
 * After the function executes, it returns an object with setCols and values keys,
 * which are desctructured on the other side
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };