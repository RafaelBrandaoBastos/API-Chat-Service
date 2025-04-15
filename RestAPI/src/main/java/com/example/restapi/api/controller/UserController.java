package com.example.restapi.api.controller;
import com.example.restapi.api.model.User;
import com.example.restapi.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/user")
    public User getUser(@RequestParam String username) {
        Optional user = userService.getUser(username);
        if(user.isPresent()) {
            return (User) user.orElse(null);
        }
        return null;
    }
}
