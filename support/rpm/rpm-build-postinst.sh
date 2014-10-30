#!/usr/bin/env bash

if [ `whoami` != 'root' ];
        then echo "this script must be executed as root" && exit 1;
fi

ADMIN_INSTALL_HOME="/opt/redbox-admin"
RB_ADMIN_SERVER_ARGS='start'

exit_install() {
	if [ $# -gt 0 ]; then
		echo "ERROR: $@." >&2
	fi
	echo "ERROR: rpm post-install incomplete." >&2
	exit 1
}

log_function() {
 printf  -- "At function: %s...\n" $1
}

install_npm() {
    log_function $FUNCNAME
    ## install must happen as non-root user within redbox-admin directory
    cd ${ADMIN_INSTALL_HOME} || exit_install "failed to change to install directory."
    sudo -Hu redbox npm install  || exit_install "failed to install npm."
}

install_server() {
    log_function $FUNCNAME
    cd ${ADMIN_INSTALL_HOME} || exit_install "failed to change to install directory."
    ## install of sails and forever must happen as root as these are created
    ## as nobody under /usr/lib/node_modules
    npm -g install sails || exit_install "failed to install sails."
    npm -g install forever || exit_install "failed to install forever."
    ## Add redbox to tomcat, required for write access to harvester input directories
    usermod -a -G tomcat -g tomcat redbox
    sudo -u redbox npm install
    chkconfig --level 2345 redbox-admin on
}

getServerArgs() {
 if ps -efl | pgrep forever > /dev/null; then
  export RB_ADMIN_SERVER_ARGS='restart'
 fi
}

start_server() {
    log_function $FUNCNAME
    cd ${ADMIN_INSTALL_HOME} || exit_install "failed to change to install directory."
    getServerArgs
    service redbox-admin start
}

install_npm
install_server
start_server