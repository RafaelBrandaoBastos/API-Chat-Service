package com.example.restapi.api.controller;

import com.example.restapi.api.model.User;
import com.example.restapi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService){
        this.userService = userService;
    }

    //POST /users/username="joao"&password="123"
    @PostMapping
    public ResponseEntity<String> createUser(@RequestParam String username, @RequestParam String password) {
        boolean created = userService.createUser(username, password);
        if (created) {
            return ResponseEntity.status(HttpStatus.CREATED).body("Usuário registrado com sucesso.");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuário já existe, senha atualizada com sucesso.");
        }
    }

    //POST /users/username="joao"&password="123"
    @PostMapping("/login")
    public ResponseEntity<String> checkUser(@RequestParam String username, @RequestParam String password) {
        boolean exist = userService.checkUser(username, password);
        if (exist) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body("Logado com sucesso.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body("Não foi possivel autenticar com sucesso.");
        }
    }


    //GET /users/{userId}
    @GetMapping("/{id}")
    public User getUser(@PathVariable Integer id){
        Optional<User> user = userService.getUser(id);
        return (User) user.orElse(null);
    }

    //GET /users/exists/{username}
    @GetMapping("/exists/{username}")
    public ResponseEntity<Boolean> userExists(@PathVariable String username) {
        boolean exists = userService.getUserByUsername(username).isPresent();
        return ResponseEntity.ok(exists); // sempre retorna 200 com true/false
    }

}