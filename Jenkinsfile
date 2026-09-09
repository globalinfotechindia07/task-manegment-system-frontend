pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm

                sh '''
                    echo "===== CHECKED OUT COMMIT ====="
                    git log -1 --oneline
                    git status
                '''
            }
        }

        stage('Node Check') {
            steps {
                sh 'node --version'
                sh 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Verify Build Output') {
            steps {
                sh '''
                    echo "===== VERIFYING BUILD ====="

                    if [ ! -d "dist" ]; then
                        echo "ERROR: dist/ folder missing!"
                        echo "Check next.config.js has:"
                        echo "output: 'export'"
                        exit 1
                    fi

                    echo "dist/ folder found successfully"

                    echo "===== BUILD FILES ====="
                    ls -lah dist/
                    echo "===== INDEX CHECK ====="
                    ls -lah dist/index.html
                '''
            }
        }

        stage('Deploy to OVIPanel') {
            steps {
                ftpPublisher(
                    alwaysPublishFromMaster: false,
                    masterNodeName: '',
                    paramPublish: [
                        parameterName: ''
                    ],
                    continueOnError: false,
                    failOnError: true,
                    publishers: [
                        [
                            configName: 'OVIPanel',

                            transfers: [
                                [
                                    asciiMode: false,
                                    cleanRemote: true,
                                    excludes: '',
                                    flatten: false,
                                    makeEmptyDirs: true,
                                    noDefaultExcludes: false,
                                    patternSeparator: '[, ]+',

                                    remoteDirectory: '/',
                                    remoteDirectorySDF: false,

                                    removePrefix: 'dist',
                                    sourceFiles: 'dist/**/*'
                                ]
                            ],

                            usePromotionTimestamp: false,
                            useWorkspaceInPromotion: false,
                            verbose: true
                        ]
                    ]
                )
            }
        }
    }

    post {
        success {
            echo '======================================'
            echo 'BUILD + DEPLOYMENT SUCCESSFUL'
            echo '======================================'
        }

        failure {
            echo '======================================'
            echo 'BUILD OR DEPLOYMENT FAILED'
            echo 'CHECK JENKINS CONSOLE OUTPUT'
            echo '======================================'
        }
    }
}
