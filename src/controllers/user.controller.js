import { asyncHandlers } from "../utils/asyncHandlers.js";


const registerUser = asyncHandlers(async (req, res) => {
    res.status(201).json({ message: "User registered successfully" });
});

export { registerUser };