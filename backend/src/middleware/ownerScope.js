/**
 * scopeToOwner — marks a request as an owner-scoped ("my content") request.
 *
 * Mounted on the teacher content routes. Controllers read `req.ownerScoped`
 * and restrict their queries with `ownerFilter(req.user)`, so a teacher only
 * ever sees and mutates content they own. Admins pass through unrestricted.
 *
 * It also strips ownership hints supplied by the client. Ownership is derived
 * exclusively from the authenticated user (JWT → req.user._id); a teacher must
 * never be able to act on behalf of another teacher by sending an id.
 */
const scopeToOwner = (req, res, next) => {
    req.ownerScoped = true;

    delete req.query.createdBy;
    delete req.query.uploadedBy;
    delete req.query.teacherId;

    if (req.body && typeof req.body === 'object') {
        delete req.body.createdBy;
        delete req.body.uploadedBy;
        delete req.body.teacherId;
    }

    next();
};

module.exports = scopeToOwner;
