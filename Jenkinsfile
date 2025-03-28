pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "shandeep04/docker_jenkins_task2:latest"
        K8S_DEPLOYMENT = "k8s/doctor-app-deployment.yaml"
        K8S_SERVICE = "k8s/doctor-app-service.yaml"
        PROMETHEUS_DEPLOYMENT = "k8s/prometheus-deployment.yaml"
        PROMETHEUS_CONFIG = "k8s/prometheus-configmap.yaml"
        GRAFANA_DEPLOYMENT = "k8s/grafana-deployment.yaml"
        KUBECONFIG = "/home/shandeep/.kube/config"
        WORK_DIR = "${WORKSPACE}"
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                echo "🧹 Cleaning workspace..."
                cleanWs()
            }
        }

        stage('Clone Repository') {
            steps {
                echo "📥 Cloning repository..."
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: 'main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/Shandeepsugumar/online-learning-platform.git',
                        credentialsId: 'github-credentials-id'
                    ]]
                ])
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "🐳 Building Docker Image: ${DOCKER_IMAGE}"
                    sh '''
                        echo "🔨 Starting Docker Build..."
                        docker build -t "$DOCKER_IMAGE" .
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    echo "📤 Pushing Docker Image to Docker Hub..."
                    withCredentials([string(credentialsId: 'docker-hub-credential', variable: 'DOCKER_HUB_TOKEN')]) {
                        sh '''
                            echo "🔐 Logging in to Docker Hub..."
                            echo "$DOCKER_HUB_TOKEN" | docker login -u "shandeep04" --password-stdin
                            echo "🚀 Pushing Docker Image: ${DOCKER_IMAGE}..."
                            docker push ${DOCKER_IMAGE}
                            echo "✅ Docker Image Push Successful!"
                        '''
                    }
                }
            }
        }

        stage('Start Minikube & Deploy App') {
            steps {
                script {
                    echo "🚀 Fixing Minikube Permissions & Deploying Application..."
                    sh '''
                        set -e
                        echo "🔧 Setting Up Minikube Environment..."
                        
                        export MINIKUBE_HOME=/var/lib/jenkins/.minikube
                        export KUBECONFIG=/var/lib/jenkins/.kube/config

                        echo "🔧 Fixing Minikube Profile Directory Permissions..."
                        sudo chown -R jenkins:jenkins $MINIKUBE_HOME || true
                        sudo chmod -R 777 $MINIKUBE_HOME || true

                        echo "🧹 Cleaning old Minikube setup..."
                        minikube delete || true

                        echo "🔄 Starting Minikube as Non-Root User..."
                        minikube start --driver=docker --force

                        echo "🔧 Fixing Kube Config Permissions..."
                        sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
                        sudo chmod -R 777 /var/lib/jenkins/.kube

                        echo "📦 Deploying to Kubernetes..."
                        kubectl apply -f ${K8S_DEPLOYMENT}
                        kubectl apply -f ${K8S_SERVICE}
                        echo "🔍 Checking Pods Status..."
                        kubectl get pods
                    '''
                }
            }
        }

        stage('Deploy Monitoring Stack') {
            steps {
                script {
                    echo "📊 Deploying Prometheus and Grafana..."
                    sh '''
                        export KUBECONFIG=/var/lib/jenkins/.kube/config
                        
                        echo "📌 Applying Prometheus Config..."
                        kubectl apply -f ${PROMETHEUS_CONFIG}
                        echo "📌 Applying Prometheus Deployment..."
                        kubectl apply -f ${PROMETHEUS_DEPLOYMENT}
                        echo "📌 Applying Grafana Deployment..."
                        kubectl apply -f ${GRAFANA_DEPLOYMENT}
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    echo "✅ Verifying Kubernetes Deployment..."
                    sh '''
                        export KUBECONFIG=/var/lib/jenkins/.kube/config
                        echo "🔍 Listing Pods..."
                        kubectl get pods
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Deployment Successful!"
        }
        failure {
            echo "❌ Deployment Failed! Check logs for details."
        }
    }
}
