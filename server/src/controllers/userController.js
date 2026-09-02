import { User } from "../models/User.js";
import { generateInviteToken } from "../utils/tokens.js";

export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    console.log('we are here')
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100,
    );

    const skip = (page - 1) * limit;

    const filter = {
      tenantId: req.user.tenantId,
    };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const inviteUser = async(req, res) =>{
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const allowedRoles = ["admin", "editor", "viewer"];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }
    const existingUser = await User.findOne({
      email,
      tenantId: req.tenantId,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists in this tenant",
      });
    }

    // Generate signed invite token
    const token = generateInviteToken({
      email,
      tenantId: req.tenantId,
      role,
    });

    // Create invite URL
    const inviteLink = `http://localhost:5173/accept-invite?token=${token}`;

    // TODO: Send inviteLink through your email service

    return res.status(201).json({
      message: "Invitation created successfully",
      inviteLink,
    });
  } catch (error) {
    console.error("Invite user error:", error);

    return res.status(500).json({
      message: "Failed to create invitation",
    });
  }
}

export const updateUserRole = async(req,res)=>{
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["admin", "editor", "viewer"];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Role must be admin or editor or viewer",
      });
    }

    const user = await User.findOne({
      _id: id,
      tenantId: req.user.tenantId,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found in this tenant",
      });
    }

    if (user.role === "owner") {
      return res.status(403).json({
        message: "Owner role cannot be changed",
      });
    }
    user.role = role;
    await user.save();
    return res.status(200).json({
      message: "User role updated successfully",
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      message: "Failed to update user role",
    });
  }
}