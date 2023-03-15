<?php
class Router {

    private $url;
    private $routes = [];
    private $namedRoutes = [];

    public function __construct($url){
        $this->url = $url;
    }

    public function get($path, $callable, $name = null){
        return $this->add($path, $callable, $name, 'GET');
    }

    public function post($path, $callable, $name = null){
        return $this->add($path, $callable, $name, 'POST');
    }

    private function add($path, $callable, $name, $method){
        $route = new Route($path, $callable);
        $this->routes[$method][] = $route;
        if(is_string($callable) && $name === null){
            $name = $callable;
        }
        if($name){
            $this->namedRoutes[$name] = $route;
        }
        return $route;
    }

    public function run(){
        if(!isset($this->routes[$_SERVER['REQUEST_METHOD']])){
            include_once("src/views/405.php");
            exit();
            //throw new RouterException('REQUEST_METHOD does not exist');
        }
        foreach($this->routes[$_SERVER['REQUEST_METHOD']] as $route){
            if($route->match($this->url)){
                return $route->call();
            }
        }
        include_once("src/views/404.php");
        exit();
        //throw new RouterException('No matching routes');
    }

    public function url($name, $params = []){
        if(!isset($this->namedRoutes[$name])){
            include_once("src/views/404.php");
            exit();
            //throw new RouterException('No route matches this name');
        }
        return $this->namedRoutes[$name]->getUrl($params);
    }

}
?>