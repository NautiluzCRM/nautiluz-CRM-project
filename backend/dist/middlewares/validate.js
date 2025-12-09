export function validate(schema) {
    return (req, res, next) => {
        const parsed = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query
        });
        if (!parsed.success) {
            return res.status(400).json({ message: 'Validation error', issues: parsed.error.issues });
        }
        Object.assign(req, parsed.data);
        next();
    };
}
