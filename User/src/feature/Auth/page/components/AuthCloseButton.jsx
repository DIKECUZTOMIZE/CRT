import { X } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";

import { getRoleHomePath, isExternalUrl } from "../../../../app/utils/roleUtils";

const AuthCloseButton = ({ onClose }) => {
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);

    const handleClose = () => {
        if (typeof onClose === "function") {
            onClose();

            if (window.location.pathname === "/login" || window.location.pathname === "/register") {
                navigate("/", { replace: true });
            }
            return;
        }

        const roleHomePath = getRoleHomePath(user?.role);

        if (window.history.length > 1 && !window.location.pathname.match(/^(\/login|\/register|\/admin\/login|\/organizer\/login|\/organizer\/register)$/)) {
            navigate(-1);
            return;
        }

        if (isExternalUrl(roleHomePath)) {
            window.location.replace(roleHomePath);
            return;
        }

        navigate(roleHomePath, { replace: true });
    };

    return (
        <button
            type="button"
            onClick={handleClose}
            aria-label="Close authentication page"
            title="Back"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
            <X className="h-5 w-5" />
        </button>
    );
};

export default AuthCloseButton;
