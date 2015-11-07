from fabric.api import local

def boot2docker_up():
    local("boot2docker up")

def remove_all_dockers():
    local("docker rm -f $(docker ps -a -q)")

def add_all_mongos0():
    for i in range(1,5):
        local("docker run --name mongo{0} -d mongo --smallfiles".format(i));

def add_all_mongos():
    for i in range(1,5):
    	local("docker run --name mongo{n} -v /home/docker/mongo/db{n}:/data/db -d mongo --smallfiles".format(n=i));

def add_rabbit_mq():
    local("docker run -d --hostname my-rabbit --name rabbit -p 15672:15672 -p 5672:5672 rabbitmq:3-management");

def add_all_students():
    for i in range(1,4):
        port = 8080 + i
        command = "docker run -d -e PORT={port} -p {port}:{port} --link mongo{n}:mongo --link rabbit:rabbitmq --name students{n} df2553/students".format(port=port, n=i);
        local(command);

def add_courses():
    local("docker run -d -e PORT=8090 -p 8090:8090 --link mongo4:mongo --name courses df2553/courses");

def add_logreader():
    local("docker run -d --link rabbit:rabbitmq --link courses:courses --name logreader df2553/logreader");

def seed():
	local("node seed/index.js");

def deploy1():
    remove_all_dockers();
    add_rabbit_mq();
    add_all_mongos();
def deploy2():
    add_all_students();
    add_courses();
    add_logreader();
    # seed();