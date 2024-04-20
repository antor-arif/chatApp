const User = require("../../models/users");
const { imageCheck, upload } = require("../../utils/file");
const { isValidEmail, usernameGenerating } = require("../../utils/func");
const bcrypt = require("bcrypt")
const salt = 11;
exports.registerUser = async(req,res,next)=>{
    let {name,username, email, phone, password} = req.body;
    let avatar = req.files.avatar;
    let issue = {};
    // Name check
		if (name) {
			const letters = /^[A-Za-z\s]+$/; // Name char validation
			name = String(name).replace(/  +/g, " ").trim();
			const validFirstName = name.match(letters);
			if (validFirstName) {
				name = name
			} else {
				issue.error = "Name is not valid!";
			}
		} else {
			issue.error = "Please enter your name!";
		}
        if (email) {
			email = String(email).replace(/\s+/g, "").trim().toLowerCase();
			const emailLengthOk = email.length < 40;
			if (emailLengthOk) {
				if (isValidEmail(email)) {
					const emailExist = await User.exists({ email });
					if (!emailExist) {
						/* username generating */
						username = await usernameGenerating(email);
						
					} else {
						issue.error = "An account has already associated with the email!";
					}
				} else {
					issue.error = "Please enter valid email address!";
				}
			} else {
				issue.error = "Email length is too long!";
			}
		} else {
			issue.error = "Please enter your email address!";
		}

        // check phone
        if (phone) {
            if (phone !== "NaN") {
                phone = phone
            } else {
                issue.error = "Phone must be number."
            }
        } 
        // check password
        if (password) {
            const hashPassword = await bcrypt.hashSync(password, salt)
            password = hashPassword
        } else {
            issue.error = "Please enter your password"
        }

        //check avatar
        if (req.files && req.files.avatar) {
            const theAvatar = req.files.avatar;
            const checkImage = imageCheck(theAvatar);
            if (checkImage.status) {
                var uploadResult = await upload(theAvatar.path);
                if (uploadResult.secure_url) {
                    
                    avatar = uploadResult.secure_url;
                } else {
                    issue.error = uploadResult.message;
                }
            } else {
                issue.error = checkImage.message;
            }
        } 

        try {
            const newUser = new User({
                name,
                email,
                password,
                username,
                avatar,
                phone

            })
            const saveUser = await newUser.save();
            if (saveUser) {
                return res.status(201).json({
                    message: "User registered successfully",
                    data: saveUser
                })
            }else{issue.error = "Failed to register user"}
            return res.status(400).json(
                issue
            )

        } catch (error) {
            next(error)
        }

}