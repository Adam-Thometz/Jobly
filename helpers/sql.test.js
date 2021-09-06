const { sqlForPartialUpdate } = require('./sql')

describe('sqlForPartialUpdate', function () {
  test('data given, one update', function () {
    const result = sqlForPartialUpdate({key: 'value'}, {jsObj: 'js_obj'}) 
    expect(result).toEqual({
      setCols: "\"key\"=$1",
      values: ["value"]
    })
  })
  test('data given, two updates', function () {
    const result = sqlForPartialUpdate({key: 'value', jsObj: 'object'}, {jsObj: 'js_obj'}) 
    expect(result).toEqual({
      setCols: "\"key\"=$1, \"js_obj\"=$2",
      values: ["value", "object"]
    })
  })
})