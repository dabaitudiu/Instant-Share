/**
 * @description test demo
 * @author Zhenhan Li
 */

function sum (a,b) {
    return a + b
}

test('10 + 20 should equal to 30', () => {
    const res = sum(10,20)
    expect(res).toBe(30)
}) 