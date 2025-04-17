package com.example.restapi.service;

import com.example.restapi.api.model.User;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private List<User> userList;

    public UserService() {
        userList = new ArrayList<>();
        User user0 = new User(0,"admin",  "admin");
        User user1 = new User(1,"Rafa",  "123");
        User user2 = new User(2,"Caio",  "123");

        userList.addAll(Arrays.asList(user0,user1,user2));
    }

    public Optional<User> getUser(Integer id) {
        Optional<User> optional = Optional.empty();
        for (User user: userList) {
            if(id == user.getId()){
                optional = Optional.of(user);
                return optional;
            }
        }
        return optional;
    }

    //AUXILIAR DO LOGIN
    public boolean checkUser(String username, String password) {
        for (User user : userList) {
            if (user.getName().equals(username) && user.getPassword().equals(password)) {
                return true;
            }
        }
        return false;
    }

    public boolean createUser(String username, String password) {
        for (User user : userList) {
            if (user.getName().equals(username)) {
                // Se o usuário existe, atualiza a senha
                user.setPassword(password);
                return false;
            }
        }
        // Se o usuário não existe, cria um novo usuário com novo id
        int newId = userList.size();
        User newUser = new User(newId, username, password);
        userList.add(newUser);
        return true;
    }

    public Optional<User> getUserByUsername(String username) {
        for (User user : userList) {
            if (user.getName().equals(username)) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

}
