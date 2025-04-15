package com.example.restapi.service;
import org.springframework.stereotype.Service;

import com.example.restapi.api.model.User;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private List<User> userList;

    public UserService() {

        userList = new ArrayList<>();

        User user = new User( "Rafa", "123");
        User user2 = new User( "Caio", "123");

        userList.addAll(Arrays.asList(user, user2));
    }

    public Optional<User> getUser(String username) {
        Optional optional = Optional.empty();
        for(User user : userList) {
            if(user.getName().equals(username)) {
                optional = Optional.of(user);
                return optional;
            }
        }
        return optional;
    }
}
