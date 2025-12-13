// src/components/RoleGuard.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function RoleGuard({ children, allowedRoles = [] }) {
	const userData = useSelector((state) => state.auth.userData);
	const userRole = userData?.role || "citizen";

	if (!allowedRoles.includes(userRole)) {
		return <Navigate to="/unauthorized" replace />;
	}

	return <>{children}</>;
}

export default RoleGuard;
