import  User  from '../models/User.model.js';

export const signup = (req, res) => {
  const { username, password, email } = req.body;

 try{
   if(!username || !email){
    return res.status(400).json({
      message: "please provide all details"
     })
   }
   
   const checked_user = User.find({email});
   
   if(checked_user) return res.status(400).json({
     message: "user with that credentials exist"
   });
   else{      
     const user = new User.create({
       username,
       password,
       email
     });
     return user;
   }
 }catch(err){
   return res.status(500).json({
     success: "false",
     message: "something went wrong"
   });
 } 
  
}
export const signin = (req, res) => {
  const { username, password } = req.body;

 try{
   if(!username){
    return res.status(400).json({
      message: "please provide all details"
     })
   }
   
   const checked_user = User.find({username});
   
   if(checked_user===username) return res.status(200).json({
     success: "true",
     message: "successfully logged in"
   });
 }catch(err){
   return res.status(500).json({
     success: "false",
     message: "something went wrong"
   });
 } 
  
}
