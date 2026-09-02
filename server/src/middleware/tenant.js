
import mongoose from 'mongoose';

import { Tenant } from '../models/Tenant.js';

export async function tenantMiddleware(req, res, next) {
  try {
    if (req.path === '/register') {
      return next();
    }

    const headerName = process.env.TENANT_HEADER || 'X-Tenant-ID';

    const tenantId =
      req.header(headerName) ||
      req.subdomains?.[0];

    if (!tenantId) {
      return res.status(400).json({
        message: 'Missing tenant ID',
      });
    }

    const query = [
      { slug: tenantId },
    ];

    if (mongoose.Types.ObjectId.isValid(tenantId)) {
      query.push({ _id: tenantId });
    }

    const tenant = await Tenant.findOne({
      $or: query,
    });

    if (!tenant) {
      return res.status(400).json({
        message: 'Invalid tenant ID',
      });
    }

    req.tenant = tenant;

    next();
  } catch (error) {
    next(error);
  }
}

