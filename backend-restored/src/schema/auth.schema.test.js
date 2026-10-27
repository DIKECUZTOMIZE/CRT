import test from "node:test";
import assert from "node:assert/strict";

import {
    loginSchema,
    registerSchema,
    organizerRegisterSchema,
    adminRegisterSchema,
    passwordResetConfirmSchema,
} from "./auth.schema.js";

const email = "schema-test@example.invalid";

test("login rejects empty and missing passwords", () => {
    const empty = loginSchema.safeParse({ body: { email, password: "" } });
    assert.equal(empty.success, false);
    assert.ok(empty.error.issues.some((issue) =>
        issue.path.join(".") === "body.password" && issue.message === "Password is required"
    ));
    assert.equal(loginSchema.safeParse({ body: { email } }).success, false);
});

test("login accepts weak non-empty passwords without trimming", () => {
    for (const password of ["a", "weakpassword", " padded ", " "]) {
        const result = loginSchema.safeParse({ body: { email, password } });
        assert.equal(result.success, true);
        assert.equal(result.data.body.password, password);
    }
});

test("login accepts 128 characters but rejects longer passwords", () => {
    assert.equal(loginSchema.safeParse({ body: { email, password: "a".repeat(128) } }).success, true);
    const result = loginSchema.safeParse({ body: { email, password: "a".repeat(129) } });
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) =>
        issue.path.join(".") === "body.password" &&
        issue.message === "Password must not exceed 128 characters"
    ));
});

test("login still rejects invalid email", () => {
    const result = loginSchema.safeParse({ body: { email: "not-an-email", password: "a" } });
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) =>
        issue.path.join(".") === "body.email" && issue.message === "Invalid email format"
    ));
});

const strongSchemas = [
    ["registration", registerSchema, "password"],
    ["organizer registration", organizerRegisterSchema, "password"],
    ["admin registration", adminRegisterSchema, "password"],
    ["password reset", passwordResetConfirmSchema, "newPassword"],
];

for (const [name, schema, passwordField] of strongSchemas) {
    test(`${name} retains all strong-password rules`, () => {
        const parse = (password) => schema.safeParse({
            body: {
                username: "schema_test",
                email,
                otp: "123456",
                registrationKey: "schema-test-only-key",
                [passwordField]: password,
            },
        });

        assert.equal(parse("ValidTest123!").success, true);
        for (const password of [
            "",
            "Short1!",
            "lowercase123!",
            "UPPERCASE123!",
            "NoDigitsHere!",
            "NoSpecial1234",
            `Aa1!${"a".repeat(125)}`,
        ]) {
            const result = parse(password);
            assert.equal(result.success, false);
            assert.ok(result.error.issues.some((issue) =>
                issue.path.join(".") === `body.${passwordField}`
            ));
        }
    });
}
