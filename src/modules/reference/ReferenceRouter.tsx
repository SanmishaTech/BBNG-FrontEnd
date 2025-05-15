import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ReferenceRouter = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Default to the given references page
    navigate("/references/given");
  }, [navigate]);

  return null; // This component just redirects, doesn't render anything
};

export default ReferenceRouter; 